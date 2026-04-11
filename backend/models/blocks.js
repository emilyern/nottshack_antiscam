// Tracks permanently blocked addresses (score 10 / blacklisted).
// Persisted to blocks.json so blocks survive server restarts.

const fs   = require('fs');
const path = require('path');

const BLOCKS_PATH = path.join(__dirname, 'blocks.json');

function loadBlocks() {
  if (!fs.existsSync(BLOCKS_PATH)) return [];
  return JSON.parse(fs.readFileSync(BLOCKS_PATH, 'utf8'));
}

function saveBlocks(blocks) {
  fs.writeFileSync(BLOCKS_PATH, JSON.stringify(blocks, null, 2));
}

/**
 * Check if an address is currently blocked.
 * Returns the block record if blocked, null otherwise.
 */
function getBlock(address) {
  const blocks = loadBlocks();
  return blocks.find(b => b.address === address) || null;
}

/**
 * Permanently block an address.
 * Idempotent — calling twice on the same address is safe.
 */
function addBlock(address, reason) {
  const blocks = loadBlocks();
  const existing = blocks.find(b => b.address === address);
  if (existing) return existing; // already blocked

  const block = {
    address,
    reason,
    blockedAt: new Date().toISOString(),
  };
  blocks.push(block);
  saveBlocks(blocks);
  return block;
}

/**
 * Remove a block (for admin use / future use).
 */
function removeBlock(address) {
  const blocks = loadBlocks().filter(b => b.address !== address);
  saveBlocks(blocks);
}

module.exports = { getBlock, addBlock, removeBlock };