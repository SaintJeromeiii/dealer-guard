const { withGradleProperties } = require('@expo/config-plugins');

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8';

function withAndroidGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const key = 'org.gradle.jvmargs';
    const existing = config.modResults.find((item) => item.type === 'property' && item.key === key);
    if (existing) {
      existing.value = JVM_ARGS;
    } else {
      config.modResults.push({ type: 'property', key, value: JVM_ARGS });
    }
    return config;
  });
}

module.exports = withAndroidGradleMemory;
