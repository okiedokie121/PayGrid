import * as freighter from "@stellar/freighter-api";
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";
import {
  NETWORK_PASSPHRASE,
} from "./constants";

export async function checkFreighterConnected(): Promise<boolean> {
  try {
    if (typeof freighter.isConnected === "function") {
      const res = await freighter.isConnected();
      return typeof res === "boolean" ? res : (res as any)?.isConnected || false;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function getConnectedWallet(): Promise<string | null> {
  try {
    const connected = await checkFreighterConnected();
    if (!connected) return null;

    if (typeof (freighter as any).getAddress === "function") {
      const res = await (freighter as any).getAddress();
      if (typeof res === "string") return res;
      if (res && typeof res.address === "string") return res.address;
    }

    if (typeof (freighter as any).getPublicKey === "function") {
      const pubKey = await (freighter as any).getPublicKey();
      if (typeof pubKey === "string") return pubKey;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function checkPayTrustline(walletAddress: string): Promise<boolean> {
  try {
    const server = new Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(walletAddress);
    const payAssetSymbol = "PAY";
    return account.balances.some((balance: any) => {
      return (
        balance.asset_type !== "native" &&
        balance.asset_code === payAssetSymbol
      );
    });
  } catch (e) {
    return true;
  }
}

export async function establishPayTrustline(walletAddress: string): Promise<string> {
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const account = await server.loadAccount(walletAddress);

  const payAsset = new Asset("PAY", walletAddress);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: payAsset,
        limit: "1000000000",
      })
    )
    .setTimeout(30)
    .build();

  const xdr = tx.toXDR();
  let signedXdr = xdr;
  if (typeof (freighter as any).signTransaction === "function") {
    const res = await (freighter as any).signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    signedXdr = typeof res === "string" ? res : (res as any)?.signedTxXdr || xdr;
  }

  const txResult = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  );

  return txResult.hash;
}
