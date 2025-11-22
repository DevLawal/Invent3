import React, { useState, useEffect, useRef } from 'react';
import { ReceiptTemplate } from '../../types';
import { DEFAULT_RECEIPT_TEMPLATE } from '../../constants';
import { PlusIcon, CameraIcon, DeleteIcon } from '../Icons';

interface ReceiptSettingsViewProps {
  templates: ReceiptTemplate[];
  onTemplatesChange: (templates: ReceiptTemplate[]) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const ReceiptSettingsView: React.FC<ReceiptSettingsViewProps> = ({ templates, onTemplatesChange }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [formData, setFormData] = useState<ReceiptTemplate>(templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_RECEIPT_TEMPLATE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      setFormData(selectedTemplate);
    } else if (templates.length > 0) {
      // Fallback if the selected ID is somehow invalid
      setSelectedTemplateId(templates[0].id);
      setFormData(templates[0]);
    }
  }, [selectedTemplateId, templates]);

  const handleInputChange = (field: keyof ReceiptTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: 'twitter' | 'instagram' | 'facebook', value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, logoBase64: base64 }));
    }
  };

  const handleSaveChanges = () => {
    const updatedTemplates = templates.map(t => t.id === selectedTemplateId ? formData : t);
    onTemplatesChange(updatedTemplates);
    alert('Changes saved successfully!');
  };

  const handleAddTemplate = () => {
    if (templates.length < 4) {
      const newTemplate = {
        ...DEFAULT_RECEIPT_TEMPLATE,
        id: crypto.randomUUID(),
        name: `Template ${templates.length + 1}`,
      };
      const newTemplates = [...templates, newTemplate];
      onTemplatesChange(newTemplates);
      setSelectedTemplateId(newTemplate.id);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (templates.length <= 1) {
      alert("You must have at least one template.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this template?")) {
      const newTemplates = templates.filter(t => t.id !== templateId);
      onTemplatesChange(newTemplates);
      // Select the first remaining template
      setSelectedTemplateId(newTemplates[0].id);
    }
  };
  
  const selectedTemplateExists = templates.some(t => t.id === selectedTemplateId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Receipt Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium mb-2">My Templates</h3>
          <div className="space-y-2">
            {templates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedTemplateId === template.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <span>{template.name}</span>
                {templates.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                    className={`p-1 rounded-full ${selectedTemplateId === template.id ? 'hover:bg-indigo-500' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-red-500'}`}
                    aria-label="Delete template"
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {templates.length < 4 && (
              <button
                onClick={handleAddTemplate}
                className="w-full flex items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add New Template
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          {selectedTemplateExists ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="templateName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Template Name</label>
                <input
                  type="text" id="templateName" value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div 
                  className="w-24 h-24 rounded-md flex items-center justify-center cursor-pointer bg-slate-100 dark:bg-slate-700 border-2 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.logoBase64 ? (
                    <img src={formData.logoBase64} alt="Logo Preview" className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <div className="text-center text-slate-500">
                      <CameraIcon className="w-8 h-8 mx-auto" />
                      <span className="text-xs">Upload Logo</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden"/>
                </div>
                <div>
                    <label htmlFor="brandColor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Brand Color</label>
                    <input
                        type="color" id="brandColor" value={formData.brandColor}
                        onChange={(e) => handleInputChange('brandColor', e.target.value)}
                        className="mt-1 w-20 h-10 p-1 block border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer bg-white dark:bg-slate-700"
                    />
                </div>
              </div>

              <div>
                <label htmlFor="headerText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Header Text</label>
                <textarea
                  id="headerText" value={formData.headerText} rows={2}
                  onChange={(e) => handleInputChange('headerText', e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"
                />
              </div>
              
              <div>
                <label htmlFor="footerText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Footer Text</label>
                <textarea
                  id="footerText" value={formData.footerText} rows={2}
                  onChange={(e) => handleInputChange('footerText', e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Social Media Links (Optional)</h4>
                <div className="space-y-2">
                    <input type="text" placeholder="Twitter URL" value={formData.socialLinks.twitter} onChange={(e) => handleSocialChange('twitter', e.target.value)} className="block w-full text-sm rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"/>
                    <input type="text" placeholder="Instagram URL" value={formData.socialLinks.instagram} onChange={(e) => handleSocialChange('instagram', e.target.value)} className="block w-full text-sm rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"/>
                    <input type="text" placeholder="Facebook URL" value={formData.socialLinks.facebook} onChange={(e) => handleSocialChange('facebook', e.target.value)} className="block w-full text-sm rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"/>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-10 py-2 px-4"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
                <p className="text-slate-500">Please create a template to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptSettingsView;
