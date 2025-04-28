import React, { useState, useEffect, useCallback } from 'react';
import { AutoComplete, Cascader, Spin, message, App } from 'antd';
import { debounce } from 'lodash';
import districtAPI, { DistrictItem } from '../../api/districtApi';
import { getPopularCities } from '../../data/chinaGeoData'; // 导入本地备用数据
import type { CascaderProps, DefaultOptionType } from 'antd/es/cascader';

// 组件属性类型
interface CitySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  size?: 'large' | 'middle' | 'small';
  allowClear?: boolean;
  disabled?: boolean;
  mode?: 'autocomplete' | 'cascader'; // 两种模式：级联和自动完成
  level?: 'province' | 'city' | 'district'; // 最小选择层级
}

// 级联选择器选项类型
interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  isLeaf?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

// 自动完成选项类型
interface AutoCompleteOption {
  value: string;
  label: React.ReactNode;
  key: string;
}

// 定义 CascaderOptionType 类型，合并 Ant Design 的 DefaultOptionType 和自定义属性
type CascaderOptionType = DefaultOptionType & {
  // 根据代码使用情况添加的自定义属性
  value?: string | number | null; // 确保 value 类型与 DefaultOptionType 兼容或覆盖它
  level?: 'country' | 'province' | 'city' | 'district' | string; // 添加 level 属性
  // children?: CascaderOptionType[]; // DefaultOptionType 可能已包含 children，如果类型不匹配则需覆盖
  // isLeaf?: boolean; // DefaultOptionType 可能已包含 isLeaf
  // loading?: boolean; // DefaultOptionType 可能已包含 loading
};

/**
 * 城市选择器组件
 * 支持两种模式：自动完成和级联选择
 */
const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChange,
  placeholder = '请选择城市',
  style,
  size = 'middle',
  allowClear = true,
  disabled = false,
  mode = 'autocomplete',
  level = 'city'
}) => {
  // 状态管理
  const [loading, setLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<DefaultOptionType[] | AutoCompleteOption[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  // 使用App.useApp获取消息实例
  const { message: messageApi } = App.useApp();
  
  // 同步外部value和内部inputValue
  useEffect(() => {
    // 如果外部value变化，更新内部inputValue
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // 加载省份数据
  const loadProvinces = async () => {
    setLoading(true);
    try {
      const provinces = await districtAPI.getProvinces();
      
      // 如果是级联模式
      if (mode === 'cascader') {
        // 使用 DefaultOptionType[] 或兼容类型，因为 CascaderOptionType 现在基于它
        const cascaderOptions: DefaultOptionType[] = provinces.map((province: DistrictItem) => ({
          value: province.name,
          label: province.name,
          isLeaf: level === 'province',
          // level: 'province', // 如果需要传递 level，需要在此处添加
          children: level !== 'province' ? [] : undefined
        }));
        setOptions(cascaderOptions);
      } 
      // 自动完成模式不预加载数据
    } catch (error) {
      console.error('加载省份数据失败:', error);
      // 不再显示错误消息，以免干扰用户体验
      // messageApi.error('加载省份数据失败，使用本地数据');
      
      // 使用本地备用数据
      const backupCities = getPopularCities();
      if (mode === 'autocomplete') {
        setOptions(backupCities.map(city => ({
          value: city.name,
          label: city.name,
          key: city.name
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  // 初始加载省份数据
  useEffect(() => {
    if (mode === 'cascader') {
      loadProvinces();
    } else if (mode === 'autocomplete' && !inputValue) {
      // 自动完成模式初始显示热门城市
      const popularCities = getPopularCities();
      setOptions(popularCities.map(city => ({
        value: city.name,
        label: city.name,
        key: city.name
      })));
    }
  }, [mode, inputValue]);

  // 级联选择器加载数据
  const loadCascaderData = async (selectedOptions: DefaultOptionType[]) => {
    // targetOption 现在的类型是 DefaultOptionType & {...}
    const targetOption = selectedOptions[selectedOptions.length - 1] as CascaderOptionType;
    targetOption.loading = true;

    try {
      // 确保 targetOption.level 存在且类型正确
      if (targetOption.level === 'country') {
        // 加载省份下的城市
        // 确保 targetOption.value 存在且类型正确
        const cities = await districtAPI.getCitiesByProvince(targetOption.value as string);
        // children 的类型应与 CascaderOptionType[] 兼容
        targetOption.children = cities.map((city: DistrictItem) => ({
          value: city.name,
          label: city.name,
          isLeaf: level === 'city',
          // level: 'city', // 如果需要传递 level
          children: level !== 'city' ? [] : undefined
        }));
      } else if (targetOption.level === 'province') {
        // 加载城市下的区县
        // 确保 targetOption.value 存在
        const districts = await districtAPI.getDistrictsByCity(targetOption.value as string);
        // children 的类型应与 CascaderOptionType[] 兼容
        targetOption.children = districts.map((district: DistrictItem) => ({
          value: district.name,
          label: district.name,
          isLeaf: true,
          // level: 'district' // 如果需要传递 level
        }));
      }
    } catch (error) {
      console.error('加载下级行政区数据失败:', error);
      messageApi.error('加载数据失败，请重试');
      targetOption.children = [];
    } finally {
      targetOption.loading = false;
      // setOptions 时确保类型兼容
      setOptions([...options as DefaultOptionType[]]);
    }
  };

  // 处理级联选择器变更
  const handleCascaderChange = (value: string[]) => {
    if (onChange) {
      // 根据level确定返回哪一级的值
      let result = '';
      if (level === 'province' && value.length > 0) {
        result = value[0];
      } else if (level === 'city' && value.length > 1) {
        result = value[1];
      } else if (level === 'district' && value.length > 2) {
        result = value[2];
      } else {
        result = value[value.length - 1];
      }
      onChange(result);
    }
  };

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (!text || text.length < 1) {
        // 输入为空时，显示热门城市
        const popularCities = getPopularCities();
        setOptions(popularCities.map(city => ({
          value: city.name,
          label: city.name,
          key: city.name
        })));
        return;
      }

      // 内部设置loading，不影响外部输入
      let searchLoading = true;
      try {
        const districts = await districtAPI.searchByKeyword(text);
        // 过滤结果：只返回符合level级别的行政区
        const filteredDistricts = districts.filter((item: DistrictItem) => {
          if (level === 'province') return item.level === 'province';
          if (level === 'city') return item.level === 'city' || item.level === 'province';
          return true; // district级别包含所有
        });

        setOptions(filteredDistricts.map((district: DistrictItem) => ({
          value: district.name,
          label: (
            <div>
              <span>{district.name}</span>
              <span style={{ float: 'right', color: '#999' }}>
                {district.level === 'province' ? '省/直辖市' : 
                 district.level === 'city' ? '城市' : '区/县'}
              </span>
            </div>
          ),
          key: district.adcode
        })));
      } catch (error) {
        console.error('搜索行政区失败:', error);
        // 出错时使用本地数据模糊匹配
        const backupCities = getPopularCities().filter(
          city => city.name.includes(text) || city.province?.includes(text)
        );
        setOptions(backupCities.map(city => ({
          value: city.name,
          label: city.name,
          key: city.name
        })));
      } finally {
        searchLoading = false;
      }
    }, 500),
    []
  );

  // 处理输入变化（自动完成模式）
  const handleSearch = (text: string) => {
    setInputValue(text);
    // 不再设置loading状态，以避免输入框被锁定
    // setLoading(true);
    debouncedSearch(text);
  };

  // 处理选择变化（自动完成模式）
  const handleSelect = (value: string) => {
    setInputValue(value);
    if (onChange) {
      onChange(value);
    }
  };

  // 处理清除操作
  const handleClear = () => {
    setInputValue('');
    if (onChange) {
      onChange('');
    }
  };

  // 允许自由输入 - 处理blur事件将当前输入值传递给onChange
  const handleBlur = () => {
    if (inputValue !== value && onChange) {
      onChange(inputValue);
    }
  };

  // 添加按键处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue && onChange) {
      onChange(inputValue);
      // 阻止表单提交
      e.preventDefault();
    }
  };

  // 渲染不同模式的选择器
  if (mode === 'cascader') {
    return (
      <App>
        <Cascader
          options={options as DefaultOptionType[]}
          loadData={loadCascaderData as any}
          onChange={handleCascaderChange as any}
          changeOnSelect
          placeholder={placeholder}
          style={style}
          size={size}
          allowClear={allowClear}
          disabled={disabled || loading}
        />
      </App>
    );
  }

  return (
    <App>
      <AutoComplete
        value={inputValue}
        options={options as AutoCompleteOption[]}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        placeholder={placeholder}
        style={style}
        size={size}
        allowClear={allowClear}
        disabled={disabled}
        notFoundContent={loading ? <Spin size="small" /> : "无匹配城市"}
      />
    </App>
  );
};

export default CitySelector; 