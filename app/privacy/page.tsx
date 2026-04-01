export default function PrivacyPolicy() {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: March 31, 2026</p>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Overview</h2>
          <p className="text-sm leading-relaxed">
            Wingspann ("we", "us", or "our") is a trip planning app for groups and families. This
            Privacy Policy explains how we collect, use, and protect your information when you use
            our app. By using Wingspann, you agree to the practices described here.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Information We Collect</h2>
          <p className="text-sm leading-relaxed mb-3">We collect the following information when you create an account or use the app:</p>
          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 text-slate-600">
            <li>Your name</li>
            <li>Your email address</li>
            <li>Trip and itinerary data you create within the app</li>
            <li>Information about group members you invite to trips</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">How We Use Your Information</h2>
          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 text-slate-600">
            <li>To create and manage your account</li>
            <li>To enable trip planning and collaboration features</li>
            <li>To send notifications related to your trips and group activity</li>
            <li>To respond to support requests</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">How We Store Your Information</h2>
          <p className="text-sm leading-relaxed">
            Your data is stored securely using Supabase, a third-party database provider. We do not
            sell, rent, or share your personal information with any third parties for marketing
            purposes.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Analytics</h2>
          <p className="text-sm leading-relaxed">
            We do not use any third-party analytics tools. We do not track your behavior across
            other apps or websites.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Children's Privacy</h2>
          <p className="text-sm leading-relaxed">
            Wingspann is not intended for children under the age of 13. We do not knowingly collect
            personal information from children under 13. If you believe a child has provided us with
            their information, please contact us and we will delete it promptly.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Your Rights</h2>
          <p className="text-sm leading-relaxed">
            You may request to access, update, or delete your personal data at any time by
            contacting us. You can also delete your account directly within the app.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Contact Us</h2>
          <p className="text-sm leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:cascoz11@yahoo.com" className="text-sky-500 hover:underline">
              hello@wingspann.com
            </a>
          </p>
        </section>
      </div>
    );
  }
  