import { Reach, test } from '@reach-sh/stdlib';
import * as IPFS from 'ipfs-core'
const stdlib = new Reach(process.env, { REACH_NO_WARN: 'Y' });

stdlib.setWalletFallback(stdlib.walletFallback({
    providerEnv: 'TestNet'
}));

const minter = await stdlib.newAccountFromMnemonic('board mechanic walk bird retreat cat abuse chalk setup pet sun bottom certain wire weapon finger olive hurt income bomb vendor tower series absorb aware');
const receiver = await stdlib.newAccountFromMnemonic('sample crater involve critic owner effort eternal put wide gossip toy resource phone nut coast memory rocket cover boat yellow cherry cousin lend absent magnet');
minter.setDebugLabel('Minter');
receiver.setDebugLabel('Receiver');

const gasLimit = 5000000;
if (stdlib.connector != 'ALGO') {
    minter.setGasLimit(gasLimit) && receiver.setGasLimit(gasLimit)
};

const fmt = (x) => stdlib.formatCurrency(x, 4);
const getBal = async (who, tok = false) => tok ? (await stdlib.balanceOf(who, tok)) : fmt(await stdlib.balanceOf(who));

const logBalance = async (acc, tok = false) => {
    const bal = await getBal(acc, tok);
    const unit = tok ? 'of the NFT' : stdlib.standardUnit;
    console.log(`${acc.getDebugLabel()} has ${bal} ${unit}.`);
    return bal;
}

await logBalance(minter);

const name = "JPals";
const symbol = "JPS";

// IPFS
const node = await IPFS.create();

const opts = { 
    supply: 1, 
    url: "bafybeidzj6waxbjcqa5vdug4jps6myvopwtwcaz2nvvtvgokz3lwfy3ndy", //asset CID
    c: null, // clawback
    f: null, // freeze address
    defaultFrozen: false, 
    reserve: null, 
    note: undefined,
};

const getIPFSData = async (opts) => {
    const stream = node.cat(opts.url);
    const decoder = new TextDecoder()
    let data = ''
    let newData;

    for await (const chunk of stream) {
        newData = data + decoder.decode(chunk, { stream: true });
    }
    //console.log(newData);
    console.log(`Getting IPFS Data...`);
    return newData;
};

// Adding data to IPFS
// const results = node.add(opts);
// for await (const { cid } of results) {
//     console.log(cid.toString());
// };

const mintNFT = async (minter, name, symbol, opts) => {
    console.log(`Minting the NFT...`);
    const theNFT = await stdlib.launchToken(minter, name, symbol, opts);
    console.log(theNFT);
    return theNFT.id;
}

const transferNFT = async (minter, receiver, nftId, supply) => {
    const preAmtNFT = await logBalance(minter, nftId);

    await receiver.tokenAccept(nftId);
    console.log(`${receiver.getDebugLabel()} opted-in to NFT`);

    await stdlib.transfer(minter, receiver, supply, nftId);
    console.log(`${supply} ${symbol} transferred from ${minter.getDebugLabel()} to ${receiver.getDebugLabel()}`);
    
    const postAmtNFT = await logBalance(receiver, nftId);
    test.chk('NFT AMT', preAmtNFT, postAmtNFT);
}

const IPFSData = await getIPFSData(opts);
const nftId = await mintNFT(minter, name, symbol, opts);
await transferNFT(minter, receiver, nftId, opts.supply);
await logBalance(minter);
process.exit(0);