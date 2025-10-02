const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// function resolveThemePath() {
//   try {
//     return path.dirname(
//       require.resolve("@minmin/theme/package.json", { paths: [projectRoot] })
//     );
//   } catch (error) {
//     const fallback = path.resolve(projectRoot, "../packages/theme");
//     return fs.existsSync(fallback) ? fallback : null;
//   }
// }

// const themePath = resolveThemePath();

// if (themePath) {
//   config.watchFolders = Array.from(
//     new Set([...(config.watchFolders || []), themePath])
//   );
//   config.resolver = {
//     ...config.resolver,
//     extraNodeModules: {
//       ...(config.resolver.extraNodeModules || {}),
//       '@minmin/theme': themePath,
//     },
//     unstable_enableSymlinks: true,
//   };
// }

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

module.exports = config;
