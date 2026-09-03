export default async () => {
  return Response.json({
    ok: true,
    app: "ESCAPE TO CHANGE",
    version: "1.1.0-cloud",
    teacherDashboardConfigured: Boolean(process.env.ETC_ADMIN_TOKEN),
    researchModeConfigured: Boolean(process.env.ETC_RESEARCH_SALT),
  }, {
    headers: { "cache-control": "no-store" }
  });
};
