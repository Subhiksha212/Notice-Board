import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Save, RotateCcw, Bell, Database, Palette, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppSetting {
  id: string;
  key: string;
  value: any;
  description: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      
      const settingsMap = (data || []).reduce((acc, setting) => {
        let value = setting.value;
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if not valid JSON
          }
        }
        acc[setting.key] = value;
        return acc;
      }, {} as Record<string, any>);

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please check if the app_settings table exists.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      setSaving(true);
      
      // FIXED: Properly handle different value types for storage
      let storedValue;
      if (typeof value === 'object' || Array.isArray(value)) {
        // Stringify objects and arrays
        storedValue = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        // Convert boolean to string for storage
        storedValue = value.toString();
      } else {
        // Keep numbers and strings as they are
        storedValue = value;
      }
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key,
          value: storedValue,
          description: getSettingDescription(key),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      setSettings(prev => ({ ...prev, [key]: value }));

      toast({
        title: "Setting Updated",
        description: `${getSettingLabel(key)} has been updated successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting. Please check console for details.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      app_name: "Application Name",
      max_notice_age_days: "Auto-Archive After (Days)",
      default_department: "Default Department",
      allowed_departments: "Allowed Departments",
      email_notifications: "Email Notifications",
      auto_archive_enabled: "Auto-Archive Enabled"
    };
    return labels[key] || key;
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      app_name: "The display name of the application",
      max_notice_age_days: "Number of days after which notices are automatically archived",
      default_department: "Default department for new notices",
      allowed_departments: "List of departments that can create notices",
      email_notifications: "Enable email notifications for new notices",
      auto_archive_enabled: "Automatically archive old notices"
    };
    return descriptions[key] || "";
  };

  const addDepartment = () => {
    const newDept = prompt("Enter department name:");
    if (newDept && newDept.trim()) {
      const currentDepts = settings.allowed_departments || [];
      if (!currentDepts.includes(newDept.trim())) {
        updateSetting('allowed_departments', [...currentDepts, newDept.trim()]);
      }
    }
  };

  const removeDepartment = (dept: string) => {
    const currentDepts = settings.allowed_departments || [];
    updateSetting('allowed_departments', currentDepts.filter((d: string) => d !== dept));
  };

  const resetToDefaults = async () => {
    if (!confirm("Are you sure you want to reset all settings to default values?")) {
      return;
    }

    const defaultSettings = {
      app_name: "Department Notice Board",
      max_notice_age_days: 365,
      default_department: "Administration",
      allowed_departments: [
        "Computer Science",
        "Information Technology",
        "Electronics & Communication",
        "Mechanical Engineering",
        "Civil Engineering",
        "Administration",
        "Library",
        "Academic Affairs"
      ],
      email_notifications: true,
      auto_archive_enabled: false
    };

    try {
      setSaving(true);
      
      // Use Promise.all for better performance
      const updatePromises = Object.entries(defaultSettings).map(([key, value]) => 
        updateSetting(key, value)
      );

      await Promise.all(updatePromises);

      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values",
        variant: "default"
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Error",
        description: "Failed to reset settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-96 shadow-glow">
          <CardContent className="text-center py-12">
            <SettingsIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Loading Settings...</h3>
            <p className="text-muted-foreground">Please wait while we fetch configuration</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle animate-fade-in">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center animate-scale-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
              <SettingsIcon className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
              Settings
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Configure application settings, manage departments, and control system behavior.
          </p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <Palette className="h-6 w-6 text-primary" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="app_name">Application Name</Label>
                <Input
                  id="app_name"
                  value={settings.app_name || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, app_name: e.target.value }))}
                  onBlur={(e) => updateSetting('app_name', e.target.value)}
                  placeholder="Department Notice Board"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_department">Default Department</Label>
                <Select 
                  value={settings.default_department || ""} 
                  onValueChange={(value) => updateSetting('default_department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings.allowed_departments || []).map((dept: string) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Department Management */}
          <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <Users className="h-6 w-6 text-primary" />
                Department Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Allowed Departments</Label>
                <Button onClick={addDepartment} size="sm">
                  Add Department
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(settings.allowed_departments || []).map((dept: string) => (
                  <Badge 
                    key={dept} 
                    variant="secondary" 
                    className="px-3 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeDepartment(dept)}
                  >
                    {dept} ×
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Click on a department badge to remove it. These departments will be available when creating notices.
              </p>
            </CardContent>
          </Card>

          {/* Archive Settings */}
          <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <Database className="h-6 w-6 text-primary" />
                Archive Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-Archive Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically archive old notices based on age
                  </p>
                </div>
                <Switch
                  checked={settings.auto_archive_enabled || false}
                  onCheckedChange={(checked) => updateSetting('auto_archive_enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_notice_age_days">Auto-Archive After (Days)</Label>
                <Input
                  id="max_notice_age_days"
                  type="number"
                  value={settings.max_notice_age_days || 365}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_notice_age_days: parseInt(e.target.value) || 365 }))}
                  onBlur={(e) => updateSetting('max_notice_age_days', parseInt(e.target.value) || 365)}
                  min="1"
                  max="9999"
                />
                <p className="text-sm text-muted-foreground">
                  Notices older than this many days will be automatically archived
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <Bell className="h-6 w-6 text-primary" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications when new notices are posted
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications || false}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button 
                  onClick={resetToDefaults} 
                  variant="outline" 
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
                <Button 
                  onClick={() => toast({ title: "Settings Saved", description: "All changes have been automatically saved", variant: "default" })}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Settings Auto-Saved"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;