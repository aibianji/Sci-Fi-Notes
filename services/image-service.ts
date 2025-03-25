import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { readBinaryFile, writeBinaryFile, BaseDirectory, createDir } from '@tauri-apps/api/fs';
import { appDataDir } from '@tauri-apps/api/path';
import { v4 as uuidv4 } from 'uuid';

// 图像类型
export interface NoteImage {
  id: string;
  noteId: string;
  path: string;
  name: string;
  type: string;
  size: number;
  timestamp: Date;
  width?: number;
  height?: number;
}

// 截图区域
export interface CaptureArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 保存图像
export async function saveImage(noteId: string, imageData: ArrayBuffer, fileName: string, type: string): Promise<NoteImage | null> {
  try {
    // 确保目录存在
    const appDir = await appDataDir();
    const imagesDir = `${appDir}/images/${noteId}`;
    await createDir(`images/${noteId}`, { dir: BaseDirectory.AppData, recursive: true });
    
    // 生成唯一文件名
    const id = uuidv4();
    const extension = fileName.split('.').pop() || 'png';
    const newFileName = `${id}.${extension}`;
    const filePath = `${imagesDir}/${newFileName}`;
    
    // 写入文件
    await writeBinaryFile(
      `images/${noteId}/${newFileName}`,
      new Uint8Array(imageData),
      { dir: BaseDirectory.AppData }
    );
    
    // 获取图像尺寸
    const dimensions = await getImageDimensions(imageData);
    
    // 创建图像记录
    const image: NoteImage = {
      id,
      noteId,
      path: filePath,
      name: fileName,
      type,
      size: imageData.byteLength,
      timestamp: new Date(),
      width: dimensions?.width,
      height: dimensions?.height
    };
    
    return image;
  } catch (error) {
    console.error('Failed to save image:', error);
    return null;
  }
}

// 加载图像
export async function loadImage(imagePath: string): Promise<ArrayBuffer | null> {
  try {
    const data = await readBinaryFile(imagePath);
    return data.buffer;
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
}

// 删除图像
export async function deleteImage(image: NoteImage): Promise<boolean> {
  try {
    await invoke('plugin:fs|remove_file', { path: image.path });
    return true;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

// 获取图像尺寸
async function getImageDimensions(data: ArrayBuffer): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const blob = new Blob([data], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  });
}

// 截取屏幕
export async function captureScreen(area?: CaptureArea): Promise<ArrayBuffer | null> {
  try {
    // 调用 Tauri 插件进行截图
    const base64Image = await invoke('plugin:screenshot|capture', { area });
    
    // 将 Base64 转换为 ArrayBuffer
    const binaryString = atob(base64Image as string);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  } catch (error) {
    console.error('Failed to capture screen:', error);
    return null;
  }
}

// 选择图像文件
export async function selectImageFile(): Promise<{ data: ArrayBuffer; name: string; type: string } | null> {
  try {
    const selected = await open({
      filters: [{
        name: '图片文件',
        extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
      }]
    });
    
    if (!selected) return null;
    
    const filePath = selected as string;
    const fileName = filePath.split(/[/\\]/).pop() || 'image.png';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = getMimeType(fileExtension);
    
    // 读取文件数据
    const data = await readBinaryFile(filePath);
    
    return {
      data: data.buffer,
      name: fileName,
      type: mimeType
    };
  } catch (error) {
    console.error('Failed to select image file:', error);
    return null;
  }
}

// 获取 MIME 类型
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// 将图像保存到文件
export async function saveImageToFile(imageData: ArrayBuffer, defaultName: string = 'screenshot.png'): Promise<boolean> {
  try {
    const filePath = await save({
      filters: [{
        name: '图片文件',
        extensions: ['png']
      }],
      defaultPath: defaultName
    });
    
    if (!filePath) return false;
    
    await writeBinaryFile(filePath, new Uint8Array(imageData));
    return true;
  } catch (error) {
    console.error('Failed to save image to file:', error);
    return false;
  }
}

