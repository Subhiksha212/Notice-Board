-- Create notices table for storing announcements and notices
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  department TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  author TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Create policies for notices
CREATE POLICY "Anyone can view active notices" 
ON public.notices 
FOR SELECT 
USING (is_archived = FALSE);

CREATE POLICY "Anyone can view archived notices" 
ON public.notices 
FOR SELECT 
USING (is_archived = TRUE);

CREATE POLICY "Authenticated users can create notices" 
ON public.notices 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notices" 
ON public.notices 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notices" 
ON public.notices 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create app settings table
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Settings policies - only authenticated users can manage settings
CREATE POLICY "Authenticated users can view settings" 
ON public.app_settings 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage settings" 
ON public.app_settings 
FOR ALL
TO authenticated
USING (true);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all active profiles" 
ON public.profiles 
FOR SELECT 
USING (is_active = TRUE);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description) VALUES
('app_name', '"Department Notice Board"', 'Application name'),
('max_notice_age_days', '365', 'Maximum age for notices before auto-archiving'),
('default_department', '"Administration"', 'Default department for new notices'),
('allowed_departments', '["Computer Science", "Information Technology", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Administration", "Library", "Academic Affairs"]', 'List of allowed departments'),
('email_notifications', 'true', 'Enable email notifications for new notices'),
('auto_archive_enabled', 'false', 'Enable automatic archiving of old notices');

-- Create function to auto-archive old notices
CREATE OR REPLACE FUNCTION public.auto_archive_notices()
RETURNS void AS $$
BEGIN
  UPDATE public.notices 
  SET is_archived = TRUE 
  WHERE is_archived = FALSE 
    AND created_at < (now() - INTERVAL '1 year');
END;
$$ LANGUAGE plpgsql;