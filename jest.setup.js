if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn();
}

require("@testing-library/jest-dom");
