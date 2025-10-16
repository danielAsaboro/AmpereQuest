use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;

declare_id!("5emVuARWebNveyqe9ivrM24yhBMdLWJvq3qzYTDDd66u");

// Authorized program IDs for CPI calls
pub const MARKETPLACE_PROGRAM_ID: Pubkey = pubkey!("9PQHr2B1MoxNwyjwdvxZcc7VifqKsetsjvikGwxu2Eko");
pub const VIRTUAL_PLOT_PROGRAM_ID: Pubkey = pubkey!("Ex4pz9FX9RQUHcSdb74MzTN4hpPFAHMKfqf3RtWcVHRc");

#[program]
pub mod charging_session {
    use super::*;

    /// Initialize a new charging session
    /// Uses timestamp + nonce to prevent PDA collisions if multiple sessions start in same second
    pub fn start_session(
        ctx: Context<StartSession>,
        charger_code: String,
        charger_power_kw: u16,
        pricing_per_kwh: u64, // in lamports
        timestamp: i64,
        nonce: u32,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;

        session.user = ctx.accounts.user.key();
        session.charger_code = charger_code;
        session.charger_power_kw = charger_power_kw;
        session.pricing_per_kwh = pricing_per_kwh;
        session.start_time = timestamp;
        session.nonce = nonce;
        session.energy_consumed_wh = 0;
        session.points_earned = 0;
        session.is_active = true;
        session.bump = ctx.bumps.session;

        msg!("Charging session started for charger: {} (nonce: {})", session.charger_code, nonce);
        Ok(())
    }

    /// Update session with energy consumed (called periodically during charging)
    pub fn update_session(
        ctx: Context<UpdateSession>,
        energy_wh_increment: u64,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;

        require!(session.is_active, ErrorCode::SessionNotActive);

        session.energy_consumed_wh = session.energy_consumed_wh
            .checked_add(energy_wh_increment)
            .ok_or(ErrorCode::Overflow)?;

        // Calculate points: 1 point per 100 Wh (0.1 kWh)
        let new_points = energy_wh_increment / 100;
        session.points_earned = session.points_earned
            .checked_add(new_points)
            .ok_or(ErrorCode::Overflow)?;

        msg!("Session updated: {} Wh consumed, {} points earned",
             session.energy_consumed_wh, session.points_earned);
        Ok(())
    }

    /// End charging session and mint points to user
    pub fn end_session(
        ctx: Context<EndSession>,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let user_account = &mut ctx.accounts.user_account;
        let clock = Clock::get()?;

        require!(session.is_active, ErrorCode::SessionNotActive);

        session.end_time = Some(clock.unix_timestamp);
        session.is_active = false;

        // Credit points to user account
        user_account.total_points = user_account.total_points
            .checked_add(session.points_earned)
            .ok_or(ErrorCode::Overflow)?;

        user_account.available_points = user_account.available_points
            .checked_add(session.points_earned)
            .ok_or(ErrorCode::Overflow)?;

        user_account.total_energy_kwh = user_account.total_energy_kwh
            .checked_add(session.energy_consumed_wh / 1000)
            .ok_or(ErrorCode::Overflow)?;

        user_account.total_sessions = user_account.total_sessions
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;

        let duration = session.end_time.unwrap() - session.start_time;

        msg!("Session ended: {} Wh in {} seconds, {} points minted",
             session.energy_consumed_wh, duration, session.points_earned);
        Ok(())
    }

    /// Initialize user account
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;

        user_account.authority = ctx.accounts.authority.key();
        user_account.total_points = 0;
        user_account.available_points = 0;
        user_account.total_energy_kwh = 0;
        user_account.total_sessions = 0;
        user_account.bump = ctx.bumps.user_account;

        msg!("User account initialized");
        Ok(())
    }

    /// Credit points to user (callable via CPI by authorized programs like marketplace)
    /// SECURITY: Only authorized programs can call this to prevent arbitrary point minting
    pub fn credit_points(
        ctx: Context<ModifyPoints>,
        amount: u64,
    ) -> Result<()> {
        // Verify caller is an authorized program by checking the caller_authority
        // The calling program must pass itself as the caller_authority signer
        let caller = ctx.accounts.caller_authority.key();
        require!(
            caller == MARKETPLACE_PROGRAM_ID || caller == VIRTUAL_PLOT_PROGRAM_ID,
            ErrorCode::UnauthorizedCaller
        );

        let user_account = &mut ctx.accounts.user_account;

        user_account.total_points = user_account.total_points
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        user_account.available_points = user_account.available_points
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        msg!("Credited {} points to user via CPI from authorized program {}", amount, caller);
        Ok(())
    }

    /// Debit points from user (callable via CPI by authorized programs like marketplace)
    /// SECURITY: Only authorized programs can call this to prevent unauthorized point burning
    pub fn debit_points(
        ctx: Context<ModifyPoints>,
        amount: u64,
    ) -> Result<()> {
        // Verify caller is an authorized program by checking the caller_authority
        // The calling program must pass itself as the caller_authority signer
        let caller = ctx.accounts.caller_authority.key();
        require!(
            caller == MARKETPLACE_PROGRAM_ID || caller == VIRTUAL_PLOT_PROGRAM_ID,
            ErrorCode::UnauthorizedCaller
        );

        let user_account = &mut ctx.accounts.user_account;

        require!(
            user_account.available_points >= amount,
            ErrorCode::InsufficientPoints
        );

        user_account.available_points = user_account.available_points
            .checked_sub(amount)
            .ok_or(ErrorCode::Underflow)?;

        msg!("Debited {} points from user via CPI from authorized program {}", amount, caller);
        Ok(())
    }

    /// Redeem a voucher from the marketplace
    /// Creates a redemption record to prevent double-spending
    /// SECURITY: Uses init constraint on redemption_record to prevent double redemption
    /// The init will fail if a redemption record already exists for this voucher
    pub fn redeem_voucher(ctx: Context<RedeemVoucher>) -> Result<()> {
        let voucher_data = &ctx.accounts.voucher.try_borrow_data()?;
        let user_account = &mut ctx.accounts.user_account;
        let redemption_record = &mut ctx.accounts.redemption_record;

        // Verify voucher is from marketplace program
        require!(
            ctx.accounts.voucher.owner == &MARKETPLACE_PROGRAM_ID,
            ErrorCode::InvalidVoucherProgram
        );

        // Parse voucher data (skip 8-byte discriminator)
        // PointsVoucher: buyer (32) + points_amount (8) + is_redeemed (1) + created_at (8) + bump (1)
        require!(voucher_data.len() >= 58, ErrorCode::InvalidVoucherData);

        let buyer = Pubkey::try_from(&voucher_data[8..40]).map_err(|_| ErrorCode::InvalidVoucherData)?;
        let points_amount = u64::from_le_bytes(
            voucher_data[40..48].try_into().map_err(|_| ErrorCode::InvalidVoucherData)?
        );

        // Verify voucher belongs to this user
        require!(buyer == user_account.authority, ErrorCode::UnauthorizedVoucher);

        // Credit points to user
        user_account.total_points = user_account.total_points
            .checked_add(points_amount)
            .ok_or(ErrorCode::Overflow)?;

        user_account.available_points = user_account.available_points
            .checked_add(points_amount)
            .ok_or(ErrorCode::Overflow)?;

        // Mark redemption record
        // NOTE: The 'init' constraint on redemption_record prevents double-spending
        // because it will fail if this PDA already exists
        redemption_record.voucher = ctx.accounts.voucher.key();
        redemption_record.user = user_account.authority;
        redemption_record.points_amount = points_amount;
        redemption_record.redeemed_at = Clock::get()?.unix_timestamp;
        redemption_record.bump = ctx.bumps.redemption_record;

        msg!("Redeemed voucher: {} points credited", points_amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(charger_code: String, charger_power_kw: u16, pricing_per_kwh: u64, timestamp: i64, nonce: u32)]
pub struct StartSession<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + ChargingSession::INIT_SPACE,
        seeds = [b"session", user.key().as_ref(), &timestamp.to_le_bytes(), &nonce.to_le_bytes()],
        bump
    )]
    pub session: Account<'info, ChargingSession>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSession<'info> {
    #[account(
        mut,
        seeds = [b"session", session.user.as_ref(), &session.start_time.to_le_bytes(), &session.nonce.to_le_bytes()],
        bump = session.bump,
        has_one = user
    )]
    pub session: Account<'info, ChargingSession>,

    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct EndSession<'info> {
    #[account(
        mut,
        seeds = [b"session", session.user.as_ref(), &session.start_time.to_le_bytes(), &session.nonce.to_le_bytes()],
        bump = session.bump,
        has_one = user
    )]
    pub session: Account<'info, ChargingSession>,

    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyPoints<'info> {
    #[account(mut)]
    pub user_account: Account<'info, UserAccount>,

    /// CHECK: PDA of the calling program - must be marketplace or virtual_plot program
    /// The calling program signs with this PDA to prove its identity
    pub caller_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RedeemVoucher<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + VoucherRedemption::INIT_SPACE,
        seeds = [b"redemption", voucher.key().as_ref()],
        bump
    )]
    pub redemption_record: Account<'info, VoucherRedemption>,

    /// CHECK: Voucher account from marketplace, validated in instruction
    pub voucher: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct ChargingSession {
    pub user: Pubkey,
    #[max_len(20)]
    pub charger_code: String,
    pub charger_power_kw: u16,
    pub pricing_per_kwh: u64,
    pub start_time: i64,
    pub nonce: u32,
    pub end_time: Option<i64>,
    pub energy_consumed_wh: u64, // in watt-hours
    pub points_earned: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub authority: Pubkey,
    pub total_points: u64,
    pub available_points: u64,
    pub total_energy_kwh: u64,
    pub total_sessions: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoucherRedemption {
    pub voucher: Pubkey,
    pub user: Pubkey,
    pub points_amount: u64,
    pub redeemed_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Session is not active")]
    SessionNotActive,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Insufficient points")]
    InsufficientPoints,
    #[msg("Arithmetic underflow")]
    Underflow,
    #[msg("Invalid voucher program")]
    InvalidVoucherProgram,
    #[msg("Invalid voucher data")]
    InvalidVoucherData,
    #[msg("Unauthorized voucher")]
    UnauthorizedVoucher,
    #[msg("Voucher already redeemed")]
    VoucherAlreadyRedeemed,
    #[msg("Unauthorized caller - only whitelisted programs can modify points")]
    UnauthorizedCaller,
}
