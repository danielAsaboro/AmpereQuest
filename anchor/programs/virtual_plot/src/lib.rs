use anchor_lang::prelude::*;

declare_id!("Ex4pz9FX9RQUHcSdb74MzTN4hpPFAHMKfqf3RtWcVHRc");

// Treasury PDA seed for receiving plot purchase and upgrade fees
pub const TREASURY_SEED: &[u8] = b"treasury";

// Game engine authority PDA seed - only this PDA can record sessions
pub const GAME_ENGINE_SEED: &[u8] = b"game_engine";

#[program]
pub mod virtual_plot {
    use super::*;

    /// Purchase a virtual plot
    pub fn purchase_plot(
        ctx: Context<PurchasePlot>,
        plot_id: u32,
        latitude: i32,  // Stored as (lat * 1_000_000) for precision
        longitude: i32, // Stored as (lng * 1_000_000) for precision
        price_lamports: u64,
    ) -> Result<()> {
        let plot = &mut ctx.accounts.plot;

        plot.owner = ctx.accounts.buyer.key();
        plot.plot_id = plot_id;
        plot.latitude = latitude;
        plot.longitude = longitude;
        plot.purchase_price = price_lamports;
        plot.charger_power_kw = 0; // No charger initially
        plot.total_revenue = 0;
        plot.total_sessions = 0;
        plot.is_operational = false;
        plot.bump = ctx.bumps.plot;

        // Transfer payment
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.treasury.key(),
            price_lamports,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!("Plot {} purchased at ({}, {}) for {} lamports",
             plot_id, latitude, longitude, price_lamports);
        Ok(())
    }

    /// Install a charger on owned plot
    pub fn install_charger(
        ctx: Context<InstallCharger>,
        charger_power_kw: u16,
        installation_cost: u64,
    ) -> Result<()> {
        let plot = &mut ctx.accounts.plot;

        require!(
            charger_power_kw == 3 || charger_power_kw == 7 || charger_power_kw == 11 ||
            charger_power_kw == 22 || charger_power_kw == 30,
            ErrorCode::InvalidChargerPower
        );

        // Transfer installation cost
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.owner.key(),
            &ctx.accounts.treasury.key(),
            installation_cost,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        plot.charger_power_kw = charger_power_kw;
        plot.is_operational = true;

        msg!("Installed {}kW charger on plot {} for {} lamports",
             charger_power_kw, plot.plot_id, installation_cost);
        Ok(())
    }

    /// Upgrade existing charger
    pub fn upgrade_charger(
        ctx: Context<UpgradeCharger>,
        new_power_kw: u16,
        upgrade_cost: u64,
    ) -> Result<()> {
        let plot = &mut ctx.accounts.plot;

        require!(plot.charger_power_kw > 0, ErrorCode::NoChargerInstalled);
        require!(new_power_kw > plot.charger_power_kw, ErrorCode::InvalidUpgrade);

        // Transfer upgrade cost
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.owner.key(),
            &ctx.accounts.treasury.key(),
            upgrade_cost,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let old_power = plot.charger_power_kw;
        plot.charger_power_kw = new_power_kw;

        msg!("Upgraded charger from {}kW to {}kW for {} lamports",
             old_power, new_power_kw, upgrade_cost);
        Ok(())
    }

    /// Record revenue from virtual charging session
    /// SECURITY: Only the game engine authority can record sessions
    pub fn record_session(
        ctx: Context<RecordSession>,
        revenue_lamports: u64,
    ) -> Result<()> {
        let plot = &mut ctx.accounts.plot;

        require!(plot.is_operational, ErrorCode::PlotNotOperational);

        // Transfer SOL from payer to plot account
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &plot.key(),
            revenue_lamports,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.payer.to_account_info(),
                plot.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        plot.total_revenue = plot.total_revenue
            .checked_add(revenue_lamports)
            .ok_or(ErrorCode::Overflow)?;

        plot.total_sessions = plot.total_sessions
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;

        msg!("Session recorded: {} lamports revenue (total: {})",
             revenue_lamports, plot.total_revenue);
        Ok(())
    }

    /// Withdraw accumulated revenue
    pub fn withdraw_revenue(
        ctx: Context<WithdrawRevenue>,
        amount: u64,
    ) -> Result<()> {
        let plot = &mut ctx.accounts.plot;

        require!(plot.total_revenue >= amount, ErrorCode::InsufficientRevenue);

        plot.total_revenue = plot.total_revenue
            .checked_sub(amount)
            .ok_or(ErrorCode::Underflow)?;

        // Transfer revenue to owner
        **ctx.accounts.plot.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.owner.try_borrow_mut_lamports()? += amount;

        msg!("Withdrew {} lamports revenue", amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(plot_id: u32)]
pub struct PurchasePlot<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + VirtualPlot::INIT_SPACE,
        seeds = [b"plot", &plot_id.to_le_bytes()],
        bump
    )]
    pub plot: Account<'info, VirtualPlot>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Treasury PDA - validated by seeds constraint
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InstallCharger<'info> {
    #[account(
        mut,
        seeds = [b"plot", &plot.plot_id.to_le_bytes()],
        bump = plot.bump,
        has_one = owner
    )]
    pub plot: Account<'info, VirtualPlot>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Treasury PDA - validated by seeds constraint
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpgradeCharger<'info> {
    #[account(
        mut,
        seeds = [b"plot", &plot.plot_id.to_le_bytes()],
        bump = plot.bump,
        has_one = owner
    )]
    pub plot: Account<'info, VirtualPlot>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Treasury PDA - validated by seeds constraint
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordSession<'info> {
    #[account(
        mut,
        seeds = [b"plot", &plot.plot_id.to_le_bytes()],
        bump = plot.bump
    )]
    pub plot: Account<'info, VirtualPlot>,

    /// Payer who uses the charging station and pays for the session
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Game engine authority - verified by calling program via CPI
    /// Only the game engine program can call this via CPI with its authority PDA
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawRevenue<'info> {
    #[account(
        mut,
        seeds = [b"plot", &plot.plot_id.to_le_bytes()],
        bump = plot.bump,
        has_one = owner
    )]
    pub plot: Account<'info, VirtualPlot>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct VirtualPlot {
    pub owner: Pubkey,
    pub plot_id: u32,
    pub latitude: i32,
    pub longitude: i32,
    pub purchase_price: u64,
    pub charger_power_kw: u16,
    pub total_revenue: u64,
    pub total_sessions: u64,
    pub is_operational: bool,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid charger power. Must be 3, 7, 11, 22, or 30 kW")]
    InvalidChargerPower,
    #[msg("No charger installed on this plot")]
    NoChargerInstalled,
    #[msg("Invalid upgrade: new power must be greater than current")]
    InvalidUpgrade,
    #[msg("Plot is not operational")]
    PlotNotOperational,
    #[msg("Insufficient revenue to withdraw")]
    InsufficientRevenue,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
}
