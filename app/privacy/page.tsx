export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: April 1, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Overview</h2>
        <p className="text-sm leading-relaxed">
          Wingspann ("we", "us", or "our") provides this app as-is for personal trip planning purposes. 
          By using Wingspann, you agree to the terms of this Privacy Policy. We reserve the right to 
          update this policy at any time without prior notice.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Information We Collect</h2>
        <p className="text-sm leading-relaxed mb-3">
          We collect only what is necessary to provide the service:
        </p>
        <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 text-slate-600">
          <li>Your name and email address when you create an account</li>
          <li>Trip and itinerary content you choose to create</li>
          <li>Information about group members you voluntarily invite</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">How We Use Your Information</h2>
        <p className="text-sm leading-relaxed mb-3">Your information is used solely to:</p>
        <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 text-slate-600">
          <li>Provide and maintain the app's core functionality</li>
          <li>Send trip-related notifications you have opted into</li>
          <li>Respond to support requests you initiate</li>
        </ul>
        <p className="text-sm leading-relaxed mt-3">
          We do not sell, rent, trade, or otherwise transfer your personal information to third parties 
          for any commercial purpose.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Data Storage</h2>
        <p className="text-sm leading-relaxed">
          Your data is stored using Supabase. While we take reasonable precautions to protect your 
          information, no method of transmission or storage is 100% secure. We cannot guarantee 
          absolute security and are not liable for unauthorized access beyond our reasonable control.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">No Analytics</h2>
        <p className="text-sm leading-relaxed">
          We do not use any third-party analytics, advertising, or tracking tools. We do not track 
          your activity across other apps or websites.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Children's Privacy</h2>
        <p className="text-sm leading-relaxed">
          Wingspann is intended for users 13 years of age and older. We do not knowingly collect 
          information from children under 13. If you believe a child has provided us their data, 
          contact us and we will delete it promptly.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Disclaimer of Liability</h2>
        <p className="text-sm leading-relaxed">
          Wingspann is provided "as is" without warranties of any kind, express or implied. We are 
          not liable for any damages arising from your use of the app, including but not limited to 
          data loss, trip disruptions, or reliance on information wqithin the app. Use of this app 
          is at your own risk.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Your Rights</h2>
        <p className="text-sm leading-relaxed">
          You may request access to, correction of, or deletion of your personal data at any time 
          by contacting us. Account deletion removes your data from our active systems.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Contact</h2>
        <p className="text-sm leading-relaxed">
          Questions about this policy? Reach us at{" "}
          <a href="mailto:cascoz11@yahoo.com" className="text-sky-500 hover:underline">
            hello@wingspann.com
          </a>
        </p>
      </section>
    </div>
  );
}
