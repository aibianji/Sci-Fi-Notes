const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 构建前的优化
console.log('🚀 开始优化构建...');

// 1. 清理不必要的依赖
console.log('📦 清理不必要的依赖...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 移动某些依赖到 devDependencies
const moveToDevDeps = [
  'vue-router', // 如果不需要路由
  '@types/*',   // 类型定义
];

for (const dep of moveToDevDeps) {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    packageJson.devDependencies[dep] = packageJson.dependencies[dep];
    delete packageJson.dependencies[dep];
    console.log(`  ✓ 将 ${dep} 移动到 devDependencies`);
  }
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// 2. 优化 Tailwind CSS
console.log('🎨 优化 Tailwind CSS...');
const tailwindConfig = `
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  // 减小生成的 CSS 大小
  variants: {
    extend: {},
  },
}
`;

fs.writeFileSync('tailwind.config.js', tailwindConfig);

// 3. 创建自定义 Vite 构建配置
console.log('⚙️ 创建优化的 Vite 构建配置...');
const viteConfig = `
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // 优化构建
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue']
        }
      }
    },
    // 减小代码块大小
    chunkSizeWarningLimit: 600,
    // 优化CSS
    cssCodeSplit: true,
    // 减小资源大小
    assetsInlineLimit: 4096
  }
});
`;

fs.writeFileSync('vite.config.ts', viteConfig);

// 4. 运行优化的构建
console.log('🔨 运行优化的构建...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 构建完成!');
} catch (error) {
  console.error('❌ 构建失败:', error);
  process.exit(1);
}

// 5. 分析构建大小
console.log('📊 分析构建大小...');
const distPath = path.resolve(__dirname, '../dist');
let totalSize = 0;

function calculateSize(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      calculateSize(filePath);
    } else {
      totalSize += stats.size;
      console.log(`  ${(stats.size / 1024).toFixed(2)} KB - ${filePath.replace(distPath, '')}`);
    }
  }
}

calculateSize(distPath);
console.log(`\n📦 总构建大小: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);

console.log('\n🎉 优化完成! 现在可以运行 npm run tauri build 来创建最终安装包');

