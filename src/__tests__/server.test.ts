import { createHttpServer } from "../server";

describe("HTTP Server", () => {
  it("creates server and Socket.io instance without listening", () => {
    const { httpServer, io } = createHttpServer();

    // Check that HTTP server exists
    expect(httpServer).toBeDefined();

    // Check that Socket.io instance exists
    expect(io).toBeDefined();

    // Close server to prevent Jest open handle
    httpServer.close();
  });
});
