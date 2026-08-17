# Portfolio CMS setup

The admin panel lives at `/admin/`. Without a Supabase connection it runs in local preview mode, so you can test the complete editing flow in one browser without changing the public site.

## Connect Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `admin/supabase-schema.sql`.
3. Create the administrator account in **Authentication > Users**.
4. Copy that user's UUID and run:

   ```sql
   insert into public.portfolio_admins (user_id)
   values ('YOUR_AUTH_USER_UUID');
   ```

5. Fill in `admin/config.js`:

   ```js
   window.PORTFOLIO_CMS_CONFIG = {
     supabaseUrl: "https://YOUR_PROJECT.supabase.co",
     publishableKey: "YOUR_PUBLISHABLE_OR_ANON_KEY",
     adminEmail: "YOUR_ADMIN_EMAIL",
     storageBucket: "portfolio-media",
   };
   ```

6. Open `/admin/`, sign in, and choose **导入当前网站内容** under **后台设置**.

## Security

- Only use a Supabase publishable/anon key in `admin/config.js`.
- Never commit a `service_role` key or database password.
- Row Level Security is enabled by `supabase-schema.sql`; only users listed in `portfolio_admins` can write content.
- Public visitors can read published projects, published articles, and site settings only.

## Content behavior

- Projects are shared by the homepage project wall, `/portfolio/`, and project detail pages.
- Articles are shared by `/articles/` and article detail pages.
- Site settings manage the about text, contact details, social link, and WeChat QR image.
- Uploaded images are stored in the public `portfolio-media` bucket.
- Draft content stays hidden from the public site.
