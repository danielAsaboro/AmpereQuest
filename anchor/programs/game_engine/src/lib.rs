use anchor_lang::prelude::*;
use virtual_plot::cpi::accounts::RecordSession as VirtualPlotRecordSession;
use virtual_plot::cpi;

declare_id!("GaMeENgNEwq9D7UJt7Fzv4LptHKCBNkzxqpGMVJ7KQRK");

const GAME_ENGINE_SEED: &[u8] = b"game_engine";

#[program]
pub mod game_engine {
    use super::*;

    /// Record a virtual charging session on a plot via CPI
    /// This is called to record virtual sessions with revenue generated
    pub fn record_session(
        ctx: Context<RecordVirtualSession>,
        revenue_lamports: u64,
    ) -> Result<()> {
        // Get the virtual_plot program ID
        let virtual_plot_program = &ctx.accounts.virtual_plot_program;
        let authority = &ctx.accounts.authority;
        let bump = ctx.bumps.authority;

        // Create the CPI context with PDA signer
        let cpi_accounts = VirtualPlotRecordSession {
            plot: ctx.accounts.plot.to_account_info(),
            payer: ctx.accounts.payer.to_account_info(),
            authority: authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        // Sign the CPI with the game_engine authority PDA
        let signer_seeds: &[&[&[u8]]] = &[&[GAME_ENGINE_SEED, &[bump]]];
        let cpi_ctx = CpiContext::new_with_signer(
            virtual_plot_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        // Call the virtual_plot program's record_session instruction via CPI
        cpi::record_session(cpi_ctx, revenue_lamports)?;

        msg!("Virtual charging session recorded: {} lamports revenue", revenue_lamports);
        Ok(())
    }

    /// Initialize the game engine authority PDA
    /// This creates the authority PDA that will sign CPI calls to virtual_plot
    pub fn initialize_game_engine(_ctx: Context<InitializeGameEngine>) -> Result<()> {
        msg!("Game engine authority initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RecordVirtualSession<'info> {
    /// CHECK: The virtual plot account to record the session on - validated by virtual_plot program
    #[account(mut)]
    pub plot: AccountInfo<'info>,

    /// The payer/user who is "charging" virtually
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Game engine authority PDA - validated by seeds constraint
    #[account(
        seeds = [GAME_ENGINE_SEED],
        bump
    )]
    pub authority: AccountInfo<'info>,

    /// The virtual_plot program to call via CPI
    pub virtual_plot_program: Program<'info, virtual_plot::program::VirtualPlot>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeGameEngine<'info> {
    #[account(
        init,
        payer = authority,
        space = 0,
        seeds = [GAME_ENGINE_SEED],
        bump
    )]
    pub game_engine: Account<'info, GameEngineAuthority>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct GameEngineAuthority {}
