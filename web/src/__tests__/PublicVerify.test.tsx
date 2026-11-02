import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicVerify } from '../pages/verify/PublicVerifyPage';
import sampleReceipt from '../content/demo-receipt.json';

describe('PublicVerify Component (SPEC §10)', () => {
  it('renders initial verification state with all 5 steps', () => {
    render(<PublicVerify />);

    expect(screen.getByText('Public Receipt Verifier')).toBeDefined();
    expect(screen.getByText('ZERO-TRUST CLIENT VERIFICATION')).toBeDefined();
    expect(screen.getByText('Zero-Trust Verification Checklist')).toBeDefined();

    // 5 checks
    expect(screen.getByText('Ed25519 Digital Signature')).toBeDefined();
    expect(screen.getByText('Content Hash Integrity (SHA-256)')).toBeDefined();
    expect(screen.getByText('RFC 6962 Merkle Batch Inclusion')).toBeDefined();
    expect(screen.getByText('EVM On-Chain Anchor')).toBeDefined();
    expect(screen.getByText('Model Weights & Policy Registry')).toBeDefined();

    // Mandatory disclaimer
    expect(screen.getByText(/Screening aid/)).toBeDefined();
  });

  it('loads sample receipt and updates verification statuses', async () => {
    render(<PublicVerify />);

    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample Receipt/i });
    fireEvent.click(loadSampleBtn);

    // Should display loaded receipt ID and results
    expect(screen.getByText('rcpt_demo_public_8832')).toBeDefined();
    expect(screen.getByText('Likely authentic')).toBeDefined();
    expect(screen.getByText('Decision Band:')).toBeDefined();

    // Signature check status
    await waitFor(() => {
      expect(
        screen.getByText(/Cryptographically valid Ed25519 digital signature/)
      ).toBeDefined();
    });

    // Content hash integrity
    await waitFor(() => {
      expect(screen.getByText(/SHA-256 match confirmed/)).toBeDefined();
    });

    // Merkle inclusion
    await waitFor(() => {
      expect(screen.getByText(/Merkle root verified/)).toBeDefined();
    });

    // EVM Anchor
    await waitFor(() => {
      expect(screen.getByText(/Attestation anchored/)).toBeDefined();
    });

    // Model & policy registry
    await waitFor(() => {
      expect(screen.getByText(/verified in registry/)).toBeDefined();
    });

    // Overall 5/5 verified
    await waitFor(() => {
      expect(screen.getByText('5/5 verified')).toBeDefined();
      expect(screen.getByText('No integrity problems found')).toBeDefined();
    });
  });

  it('correctly fails checks when tampered data is provided', async () => {
    render(<PublicVerify />);
    const textarea = screen.getByPlaceholderText(/Paste detection receipt JSON here/i);

    // Tampered demo receipt where score/decision was modified and invalid anchor/model
    const tampered = {
      ...sampleReceipt,
      result: { decision: 'likely_manipulated', p_bal: 0.99 },
      anchor: { chain_id: 11155111, contract: 'invalid_contract', tx_hash: 'bad_tx' },
      model: { bundle_id: 'unknown_fake_model' },
    };

    fireEvent.change(textarea, { target: { value: JSON.stringify(tampered) } });

    await waitFor(() => {
      // Signature must fail because payload was modified
      expect(screen.getByText(/Ed25519 signature verification failed/)).toBeDefined();
      // EVM anchor must fail because contract address is invalid
      expect(screen.getByText(/Invalid EVM anchor contract format/)).toBeDefined();
      // Model registry must fail because model is unknown
      expect(screen.getByText(/is not recognized in the verified model registry/)).toBeDefined();
    });
  });

  it('displays textarea for manual receipt input', () => {
    render(<PublicVerify />);

    const textarea = screen.getByPlaceholderText(/Paste detection receipt JSON here/i);
    expect(textarea).toBeDefined();

    // Entering invalid JSON shows error message
    fireEvent.change(textarea, { target: { value: 'invalid-json' } });
    expect(screen.getAllByText(/Invalid JSON format in receipt file/i).length).toBeGreaterThan(0);
  });
});
