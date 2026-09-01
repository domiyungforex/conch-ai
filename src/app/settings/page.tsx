'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Save, LogOut, Trash2, Bell, BookOpen, Palette, Brain } from 'lucide-react';

interface Settings {
  preferred_translation: string;
  theme: string;
  font_size: string;
  memory_enabled: string;
  show_verse_numbers: string;
  daily_reminder: string;
  reminder_time: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [settings, setSettings] = useState<Settings>({
    preferred_translation: 'kjv',
    theme: 'light',
    font_size: 'medium',
    memory_enabled: 'true',
    show_verse_numbers: 'true',
    daily_reminder: 'false',
    reminder_time: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isPending && !session) { router.push('/sign-in'); return; }
    fetchSettings();
  }, [session, isPending]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) { console.error('Failed to fetch settings:', err); }
    finally { setLoading(false); }
  };

  const saveSettings = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch (err) { console.error('Failed to save settings:', err); }
    finally { setSaving(false); }
  };

  const handleSignOut = async () => { await signOut(); window.location.href = '/'; };

  if (isPending || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>;
  }
  if (!session) return null;

  const Toggle = ({ value, onChange }: { value: string; onChange: () => void }) => (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${value === 'true' ? 'bg-stone-900' : 'bg-stone-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value === 'true' ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>
        <p className="text-stone-500 mt-1">Customize your experience</p>
      </div>

      <div className="space-y-6">
        <Card className="bg-white border-stone-200">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-stone-500" /> Reading Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Preferred Translation</label>
              <select value={settings.preferred_translation} onChange={(e) => setSettings({ ...settings, preferred_translation: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
                <option value="kjv">King James Version (KJV)</option>
                <option value="niv">New International Version (NIV)</option>
                <option value="esv">English Standard Version (ESV)</option>
                <option value="nlt">New Living Translation (NLT)</option>
              </select>
              <p className="text-xs text-stone-500 mt-1">Currently only KJV is available</p>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Font Size</label>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button key={size} onClick={() => setSettings({ ...settings, font_size: size })}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${settings.font_size === size ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'}`}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-stone-700">Show Verse Numbers</p><p className="text-xs text-stone-500">Display verse numbers in the Bible reader</p></div>
              <Toggle value={settings.show_verse_numbers} onChange={() => setSettings({ ...settings, show_verse_numbers: settings.show_verse_numbers === 'true' ? 'false' : 'true' })} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-stone-200">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-stone-500" /> Appearance</CardTitle></CardHeader>
          <CardContent>
            <label className="text-sm font-medium text-stone-700 mb-2 block">Theme</label>
            <div className="flex gap-2">
              {[{ value: 'light', label: 'Light', icon: '☀️' }, { value: 'dark', label: 'Dark', icon: '🌙' }, { value: 'system', label: 'System', icon: '💻' }].map((t) => (
                <button key={t.value} onClick={() => setSettings({ ...settings, theme: t.value })}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${settings.theme === t.value ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-stone-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-stone-500" /> AI & Memory</CardTitle>
            <CardDescription>Control how THE WAY remembers your conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-stone-700">Enable Memory</p><p className="text-xs text-stone-500">Allow AI to remember previous conversations</p></div>
              <Toggle value={settings.memory_enabled} onChange={() => setSettings({ ...settings, memory_enabled: settings.memory_enabled === 'true' ? 'false' : 'true' })} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-stone-200">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-stone-500" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-stone-700">Daily Reminder</p><p className="text-xs text-stone-500">Get a daily Scripture reminder</p></div>
              <Toggle value={settings.daily_reminder} onChange={() => setSettings({ ...settings, daily_reminder: settings.daily_reminder === 'true' ? 'false' : 'true' })} />
            </div>
            {settings.daily_reminder === 'true' && (
              <div><label className="text-sm font-medium text-stone-700 mb-2 block">Reminder Time</label>
                <Input type="time" value={settings.reminder_time} onChange={(e) => setSettings({ ...settings, reminder_time: e.target.value })} className="w-full" /></div>
            )}
          </CardContent>
        </Card>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>

        <Card className="bg-white border-stone-200">
          <CardHeader><CardTitle className="text-lg">Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center">
                <span className="text-sm font-medium text-stone-600">{session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}</span>
              </div>
              <div><p className="text-sm font-medium text-stone-900">{session.user.name || 'User'}</p><p className="text-xs text-stone-500">{session.user.email}</p></div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSignOut} className="flex-1"><LogOut className="h-4 w-4 mr-2" /> Sign Out</Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
            </div>
            {showDeleteConfirm && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-3">Are you sure? This will permanently delete your account and all data.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">Yes, Delete</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
