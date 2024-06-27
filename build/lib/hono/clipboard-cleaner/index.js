export default {
  async scheduled(event, env, ctx) {
    const db = env.DB;
    try {
      await db
        .prepare("DELETE FROM clipboard WHERE expires_at < CURRENT_TIMESTAMP")
        .run();
      console.log("Expired clipboard content cleaned up successfully");
    } catch (error) {
      console.error("Failed to clean up expired clipboard content", error);
    }
  },
};
