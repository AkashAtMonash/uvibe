import withPWA from "@ducanh2912/next-pwa";

const pwa = withPWA({
  dest: "public",
  register: false,
  skipWaiting: true,
  workboxOptions: {
    importScripts: ["/worker-custom.js"],
  },
});

export default pwa({
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
});
