use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;

declare_id!("9PQHr2B1MoxNwyjwdvxZcc7VifqKsetsjvikGwxu2Eko");

// Charging session program ID (for CPI authorization)
pub const CHARGING_SESSION_PROGRAM_ID: Pubkey = pubkey!("5emVuARWebNveyqe9ivrM24yhBMdLWJvq3qzYTDDd66u");

const DISCOUNT_PERCENTAGE: u64 = 50; // Web3 users get 50% discount

#[program]
pub mod points_marketplace {
    use super::*;

    /// Initialize marketplace
    pub fn initialize_marketplace(ctx: Context<InitializeMarketplace>) -> Result<()> {
        let marketplace = &mut ctx.accounts.marketplace;

        marketplace.authority = ctx.accounts.authority.key();
        marketplace.total_points_sold = 0;
        marketplace.total_revenue_lamports = 0;
        marketplace.price_per_point_lamports = 1_000_000; // 0.001 SOL per point
        marketplace.bump = ctx.bumps.marketplace;

        msg!("Marketplace initialized with price: {} lamports per point",
             marketplace.price_per_point_lamports);
        Ok(())
    }

    /// Create a sell listing (drivers selling their points)
    /// Note: Seller must have points in their charging_session account
    /// Listing is a commitment - points stay in seller's account until purchase
    pub fn create_listing(
        ctx: Context<CreateListing>,
        points_amount: u64,
        price_per_point: u64,
        timestamp: i64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;

        listing.seller = ctx.accounts.seller.key();
        listing.points_amount = points_amount;
        listing.price_per_point = price_per_point;
        listing.is_active = true;
        listing.created_at = timestamp;
        listing.bump = ctx.bumps.listing;

        msg!("Listing created: {} points at {} lamports each",
             points_amount, price_per_point);
        Ok(())
    }

    /// Buy points from marketplace at 50% discount (Web3 users)
    /// Issues a voucher that can be redeemed in charging_session program
    pub fn buy_from_marketplace(
        ctx: Context<BuyFromMarketplace>,
        points_amount: u64,
        timestamp: i64,
    ) -> Result<()> {
        let marketplace = &ctx.accounts.marketplace;
        let voucher = &mut ctx.accounts.voucher;

        // Calculate discounted price (50% off)
        let full_price = marketplace.price_per_point_lamports
            .checked_mul(points_amount)
            .ok_or(ErrorCode::Overflow)?;

        let discounted_price = full_price
            .checked_mul(DISCOUNT_PERCENTAGE)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(100)
            .ok_or(ErrorCode::DivisionByZero)?;

        // Transfer SOL from buyer to marketplace
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &marketplace.key(),
            discounted_price,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.buyer.to_account_info(),
                marketplace.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Create voucher for buyer to redeem later
        voucher.buyer = ctx.accounts.buyer.key();
        voucher.points_amount = points_amount;
        voucher.is_redeemed = false;
        voucher.created_at = timestamp;
        voucher.bump = ctx.bumps.voucher;

        msg!("Purchased {} points for {} lamports (50% discount) - voucher created",
             points_amount, discounted_price);
        Ok(())
    }

    /// Buy points from a user listing
    /// Issues a voucher to buyer, seller must transfer points separately
    pub fn buy_from_listing(
        ctx: Context<BuyFromListing>,
        timestamp: i64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let voucher = &mut ctx.accounts.voucher;

        require!(listing.is_active, ErrorCode::ListingNotActive);

        let total_price = listing.price_per_point
            .checked_mul(listing.points_amount)
            .ok_or(ErrorCode::Overflow)?;

        // Transfer SOL from buyer to seller
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &listing.seller,
            total_price,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Create voucher for buyer
        voucher.buyer = ctx.accounts.buyer.key();
        voucher.points_amount = listing.points_amount;
        voucher.is_redeemed = false;
        voucher.created_at = timestamp;
        voucher.bump = ctx.bumps.voucher;

        // Deactivate listing
        listing.is_active = false;

        msg!("Bought {} points for {} lamports from listing - voucher created",
             listing.points_amount, total_price);
        Ok(())
    }

    /// Cancel a listing
    /// Points remain in seller's account (no transfer needed)
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;

        require!(listing.is_active, ErrorCode::ListingNotActive);

        listing.is_active = false;

        msg!("Listing cancelled");
        Ok(())
    }

    /// Mark a voucher as redeemed (CPI from charging_session program)
    /// SECURITY: Only the charging_session program can call this
    pub fn mark_voucher_redeemed(ctx: Context<MarkVoucherRedeemed>) -> Result<()> {
        // Verify caller is the charging session program
        let caller = ctx.accounts.caller_authority.key();
        require!(
            caller == CHARGING_SESSION_PROGRAM_ID,
            ErrorCode::UnauthorizedCaller
        );

        let voucher = &mut ctx.accounts.voucher;

        // Check if already redeemed
        require!(!voucher.is_redeemed, ErrorCode::VoucherAlreadyRedeemed);

        // Mark as redeemed
        voucher.is_redeemed = true;

        msg!("Voucher marked as redeemed");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Marketplace::INIT_SPACE,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(points_amount: u64, price_per_point: u64, timestamp: i64)]
pub struct CreateListing<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + PointsListing::INIT_SPACE,
        seeds = [b"listing", seller.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub listing: Account<'info, PointsListing>,

    #[account(mut)]
    pub seller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(points_amount: u64, timestamp: i64)]
pub struct BuyFromMarketplace<'info> {
    #[account(
        mut,
        seeds = [b"marketplace"],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    #[account(
        init,
        payer = buyer,
        space = 8 + PointsVoucher::INIT_SPACE,
        seeds = [b"voucher", buyer.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub voucher: Account<'info, PointsVoucher>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(timestamp: i64)]
pub struct BuyFromListing<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.seller.as_ref(), &listing.created_at.to_le_bytes()],
        bump = listing.bump
    )]
    pub listing: Account<'info, PointsListing>,

    #[account(
        init,
        payer = buyer,
        space = 8 + PointsVoucher::INIT_SPACE,
        seeds = [b"voucher", buyer.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub voucher: Account<'info, PointsVoucher>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Seller account to receive payment
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(
        mut,
        seeds = [b"listing", seller.key().as_ref(), &listing.created_at.to_le_bytes()],
        bump = listing.bump,
        has_one = seller
    )]
    pub listing: Account<'info, PointsListing>,

    pub seller: Signer<'info>,
}

#[derive(Accounts)]
pub struct MarkVoucherRedeemed<'info> {
    #[account(
        mut,
        seeds = [b"voucher", voucher.buyer.as_ref(), &voucher.created_at.to_le_bytes()],
        bump = voucher.bump
    )]
    pub voucher: Account<'info, PointsVoucher>,

    /// CHECK: PDA of the calling program - must be charging_session program
    /// The calling program signs with this PDA to prove its identity
    pub caller_authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Marketplace {
    pub authority: Pubkey,
    pub total_points_sold: u64,
    pub total_revenue_lamports: u64,
    pub price_per_point_lamports: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PointsListing {
    pub seller: Pubkey,
    pub points_amount: u64,
    pub price_per_point: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PointsVoucher {
    pub buyer: Pubkey,
    pub points_amount: u64,
    pub is_redeemed: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Voucher already redeemed")]
    VoucherAlreadyRedeemed,
    #[msg("Unauthorized caller - only charging_session program can mark vouchers as redeemed")]
    UnauthorizedCaller,
}
