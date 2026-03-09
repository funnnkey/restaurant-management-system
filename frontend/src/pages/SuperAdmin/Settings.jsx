import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultTaxRate: 18,
    platformCharge: 2.5,
    minOrderValue: 100,
    maxOrderValue: 10000,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    platformName: 'Aapki Rasoi',
    supportEmail: 'support@aapkirasoi.com',
    supportPhone: '+91-XXXXXXXXXX',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setSettings(prev => ({
        ...prev,
        ...response.data
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-2">Configure global platform settings and defaults</p>
        </div>

        {/* Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-medium text-blue-900">Important</p>
            <p className="text-sm text-blue-800 mt-1">Changes to these settings will affect all restaurants on the platform</p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow">
          {/* Platform Information */}
          <div className="border-b border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                  <input
                    type="text"
                    name="platformName"
                    value={settings.platformName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                    <input
                      type="email"
                      name="supportEmail"
                      value={settings.supportEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                    <input
                      type="tel"
                      name="supportPhone"
                      value={settings.supportPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="border-b border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Financial Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    name="defaultTaxRate"
                    value={settings.defaultTaxRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default tax rate for all restaurants</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Charge (%)</label>
                  <input
                    type="number"
                    name="platformCharge"
                    value={settings.platformCharge}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Commission taken per order</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    name="minOrderValue"
                    value={settings.minOrderValue}
                    onChange={handleInputChange}
                    min="0"
                    step="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Order Value (₹)</label>
                  <input
                    type="number"
                    name="maxOrderValue"
                    value={settings.maxOrderValue}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-b border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Settings</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-gray-700">Enable Email Notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={settings.smsNotifications}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-gray-700">Enable SMS Notifications</span>
                </label>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="border-b border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">System Settings</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-gray-700">Maintenance Mode</span>
                </label>
                <p className="text-xs text-gray-500 ml-7">When enabled, only superadmins can access the platform</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => fetchSettings()}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Backup & Recovery */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Backup & Recovery</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
              Export Database Backup
            </button>
            <button className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
              View Backup History
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
