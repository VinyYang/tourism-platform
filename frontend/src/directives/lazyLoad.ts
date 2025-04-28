/**
 * 图片懒加载指令
 * 基于Intersection Observer实现
 */

// 懒加载选项接口
interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
}

// 默认选项
const defaultOptions: LazyLoadOptions = {
  threshold: 0.1,
  rootMargin: '0px',
  root: null
};

/**
 * 创建观察器
 * @param options 观察器选项
 * @returns IntersectionObserver实例
 */
const createObserver = (options: LazyLoadOptions = {}): IntersectionObserver => {
  const { threshold, rootMargin, root } = { ...defaultOptions, ...options };
  
  return new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const dataSrc = element.getAttribute('data-src');
        
        if (element.tagName === 'IMG' && dataSrc) {
          const imgElement = element as HTMLImageElement;
          
          // 设置src属性
          imgElement.src = dataSrc;
          
          // 添加加载class
          imgElement.classList.add('lazy-loaded');
          
          // 移除data-src属性
          imgElement.removeAttribute('data-src');
          
          // 停止观察该元素
          observer.unobserve(element);
        } else if (element.tagName === 'DIV' && dataSrc) {
          // 对于背景图片
          element.style.backgroundImage = `url(${dataSrc})`;
          
          // 添加加载class
          element.classList.add('lazy-loaded');
          
          // 移除data-src属性
          element.removeAttribute('data-src');
          
          // 停止观察该元素
          observer.unobserve(element);
        }
      }
    });
  }, { threshold, rootMargin, root });
};

// 创建默认观察器
let defaultObserver: IntersectionObserver | null = null;

/**
 * 获取默认观察器
 * @returns 默认观察器实例
 */
const getDefaultObserver = (): IntersectionObserver => {
  if (!defaultObserver) {
    defaultObserver = createObserver();
  }
  return defaultObserver;
};

/**
 * 监听元素
 * @param element 要监听的元素
 * @param observer 观察器实例
 */
const observe = (element: HTMLElement, observer?: IntersectionObserver): void => {
  const currentObserver = observer || getDefaultObserver();
  
  // 确保元素有data-src属性
  if (element.getAttribute('data-src')) {
    // 添加懒加载class
    element.classList.add('lazy-loading');
    
    // 观察元素
    currentObserver.observe(element);
  }
};

/**
 * 初始化页面上所有带有data-src属性的元素
 * @param selector 选择器
 * @param options 观察器选项
 */
export const initLazyLoad = (
  selector: string = '[data-src]',
  options?: LazyLoadOptions
): void => {
  // 判断是否支持IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    // 如果不支持，则立即加载所有图片
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      const dataSrc = element.getAttribute('data-src');
      
      if (element.tagName === 'IMG' && dataSrc) {
        (element as HTMLImageElement).src = dataSrc;
      } else if (dataSrc) {
        (element as HTMLElement).style.backgroundImage = `url(${dataSrc})`;
      }
      
      element.removeAttribute('data-src');
    });
    
    return;
  }
  
  // 创建观察器
  const observer = createObserver(options);
  
  // 获取所有带有data-src属性的元素
  const elements = document.querySelectorAll(selector);
  
  // 观察所有元素
  elements.forEach(element => {
    observe(element as HTMLElement, observer);
  });
};

/**
 * 销毁默认观察器
 */
export const destroyLazyLoad = (): void => {
  if (defaultObserver) {
    defaultObserver.disconnect();
    defaultObserver = null;
  }
};

export default {
  initLazyLoad,
  destroyLazyLoad,
  observe
}; 