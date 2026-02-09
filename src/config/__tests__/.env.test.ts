describe("Test environment", () => {
  it("runs in test mode", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
