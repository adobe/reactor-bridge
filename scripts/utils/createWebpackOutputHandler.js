const noop = () => {};

module.exports = (successCallback = noop, errorCallback = noop) => {
  return (err, stats) => {
    console.log(err || stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true
    }));

    if (err) {
      errorCallback(err);
    } else {
      successCallback();
    }
  };
};
