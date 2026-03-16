import withPWA from "@ducanh2912/next-pwa";

const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwa({
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
});
