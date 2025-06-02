const bundles = require('../config/bundles.json');

function getAllBundles() {
  return bundles;
}

function getBundleByIndex(index) {
  return bundles[index - 1]; // 1-based user input
}

function getBundleById(id) {
  return bundles.find(b => b.id === id);
}

module.exports = { getAllBundles, getBundleByIndex, getBundleById };
