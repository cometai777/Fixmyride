import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GenericTableView from '../common/GenericTableView';

const InventoryView = ({ showToast }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      const [catData, subData] = await Promise.all([
        (supabase as any).from('service_categories').select('code, name, id'),
        (supabase as any).from('service_subcategories').select('code, name, category_id')
      ]);
      
      setCategories(catData.data || []);
      setSubcategories(subData.data || []);
    }
    fetchOptions();
  }, []);

  return (
    <GenericTableView
      title="Inventory / Parts"
      tableName="parts"
      onToast={showToast}
      columns={[
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Part Name' },
        { key: 'brand', label: 'Brand' },
        { key: 'compatible_make', label: 'Make', formatter: (val: any) => val || '—' },
        { key: 'compatible_model', label: 'Model', formatter: (val: any) => val || '—' },
        { key: 'compatible_year', label: 'Year', formatter: (val: any) => val || '—' },
        { key: 'specs', label: 'Specs', formatter: (val: any) => (val ? String(val) : '—') },
        { key: 'category_code', label: 'Category', formatter: (val: any) => val?.toUpperCase() || 'N/A' },
        { key: 'subcategory_code', label: 'Subcategory', formatter: (val: any) => val?.toUpperCase() || 'N/A' },
        { key: 'sale_price', label: 'Sale Price', formatter: (val: any) => `AED ${val || 0}` },
        { key: 'cost_price', label: 'Cost Price', formatter: (val: any) => `AED ${val || 0}` },
        { key: 'quantity', label: 'Stock', formatter: (val: any) => <span style={{ fontWeight: 800, color: (val || 0) < 5 ? '#ef4444' : 'inherit' }}>{val || 0}</span> },
        {
          key: 'is_active',
          label: 'Status',
          formatter: (val: any, _: any, update: any) => (
            <span
              className={`badge ${val ? 'badge-success' : 'badge-warning'}`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                update({ is_active: !val });
              }}
            >
              {val ? 'Active' : 'Inactive'}
            </span>
          )
        },
      ]}
      fields={[
        { name: 'name', label: 'Part Name' },
        { name: 'sku', label: 'SKU' },
        { name: 'brand', label: 'Brand' },
        { name: 'compatible_make', label: 'Compatible Make', placeholder: 'e.g. Toyota, BMW' },
        { name: 'compatible_model', label: 'Compatible Model', placeholder: 'e.g. Camry, X5' },
        { name: 'category_code', label: 'Service Category', type: 'select', options: categories.map(c => c.code) },
        { 
          name: 'subcategory_code', 
          label: 'Subcategory', 
          type: 'select', 
          options: (data: any) => {
            const catId = categories.find(c => c.code === data.category_code)?.id;
            const subs = catId ? subcategories.filter(s => s.category_id === catId) : subcategories;
            return subs.map(s => s.code);
          }
        },
        { name: 'compatible_year', label: 'Year Compatibility', placeholder: 'e.g. 2015-2022 or 2024' },
        { name: 'specs', label: 'Technical Specifications', type: 'textarea' },
        { name: 'sale_price', label: 'Sale Price (AED)', type: 'number' },
        { name: 'cost_price', label: 'Cost Price (AED)', type: 'number' },
        { name: 'currency', label: 'Currency', placeholder: 'e.g. AED, USD' },
        { name: 'quantity', label: 'Current Stock', type: 'number' },
        { name: 'is_active', label: 'Active Status', type: 'checkbox' },
      ]}
    />
  );
};

export default InventoryView;
