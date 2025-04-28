import axios from 'axios';
import { message } from 'antd';
import { api } from './api';
import { ItineraryTemplate, DEFAULT_TEMPLATES } from '../models/ItineraryTemplates';

// 模板查询参数接口
interface TemplateQueryParams {
  type?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// 模板API返回接口
interface TemplateApiResponse {
  templates: ItineraryTemplate[];
  total: number;
  currentPage: number;
  totalPages: number;
}

/**
 * 模板API接口
 * 提供模板相关的API调用
 */
export const templateAPI = {
  /**
   * 获取模板列表
   * @param params 查询参数
   * @returns 模板列表和分页信息
   */
  getTemplates: async (params?: TemplateQueryParams): Promise<TemplateApiResponse> => {
    try {
      // 如果后端API还没有实现，返回默认模板列表
      // TODO: 实现真正的后端API调用
      // const response = await api.get('/templates', { params });
      // return response.data;
      
      // 模拟API返回
      const templates = DEFAULT_TEMPLATES;
      
      // 基于查询参数过滤模板
      let filteredTemplates = templates;
      if (params?.type) {
        filteredTemplates = filteredTemplates.filter(t => t.type === params.type);
      }
      
      if (params?.keyword) {
        const keyword = params.keyword.toLowerCase();
        filteredTemplates = filteredTemplates.filter(t => 
          t.name.toLowerCase().includes(keyword) || 
          t.description.toLowerCase().includes(keyword) ||
          t.tags.some(tag => tag.toLowerCase().includes(keyword))
        );
      }
      
      // 模拟分页
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pagedTemplates = filteredTemplates.slice(start, end);
      
      return {
        templates: pagedTemplates,
        total: filteredTemplates.length,
        currentPage: page,
        totalPages: Math.ceil(filteredTemplates.length / pageSize)
      };
    } catch (error) {
      console.error('获取模板列表失败:', error);
      throw error;
    }
  },
  
  /**
   * 获取单个模板详情
   * @param id 模板ID
   * @returns 模板详情
   */
  getTemplateDetail: async (id: string): Promise<ItineraryTemplate> => {
    try {
      // 如果后端API还没有实现，从默认模板中查找
      // TODO: 实现真正的后端API调用
      // const response = await api.get(`/templates/${id}`);
      // return response.data;
      
      // 模拟API返回
      const template = DEFAULT_TEMPLATES.find(t => t.id === id);
      if (!template) {
        throw new Error('模板不存在');
      }
      
      return template;
    } catch (error) {
      console.error(`获取模板${id}详情失败:`, error);
      throw error;
    }
  },
  
  /**
   * 获取热门模板
   * @param limit 返回数量
   * @returns 热门模板列表
   */
  getPopularTemplates: async (limit: number = 3): Promise<ItineraryTemplate[]> => {
    try {
      // 如果后端API还没有实现，从默认模板中选择popularity最高的几个
      // TODO: 实现真正的后端API调用
      // const response = await api.get('/templates/popular', { params: { limit } });
      // return response.data;
      
      // 模拟API返回
      return DEFAULT_TEMPLATES
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);
    } catch (error) {
      console.error('获取热门模板失败:', error);
      throw error;
    }
  },
  
  /**
   * 根据用户偏好获取推荐模板
   * 根据用户历史行程偏好提供个性化推荐
   * @returns 推荐模板列表
   */
  getRecommendedTemplates: async (): Promise<ItineraryTemplate[]> => {
    try {
      // 如果后端API还没有实现，返回默认模板列表
      // TODO: 实现真正的后端API调用
      // const response = await api.get('/templates/recommended');
      // return response.data;
      
      // 模拟API返回
      return DEFAULT_TEMPLATES.slice(0, 2);
    } catch (error) {
      console.error('获取推荐模板失败:', error);
      return DEFAULT_TEMPLATES.slice(0, 2); // 出错时也返回一些默认模板
    }
  }
};

export default templateAPI; 