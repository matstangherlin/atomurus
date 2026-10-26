(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AtomurusIsoQuiz = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function shuffleOptions(arr, rng) {
    var out = arr.slice();
    var random = typeof rng === 'function' ? rng : Math.random;
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }
  return { shuffleOptions: shuffleOptions };
});
