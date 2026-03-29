import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            print("Push permission granted: \(granted)")
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        print("FCM Token: \(token)")
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
            self.injectTokenIntoWebView(token: token)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 6.0) {
            self.debugLocalStorage(fcmToken: token)
        }
    }

    func findWKWebView(in view: UIView) -> WKWebView? {
        if let webView = view as? WKWebView { return webView }
        for subview in view.subviews {
            if let found = findWKWebView(in: subview) { return found }
        }
        return nil
    }

    func injectTokenIntoWebView(token: String) {
        guard let rootVC = window?.rootViewController,
              let webView = findWKWebView(in: rootVC.view) else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { self.injectTokenIntoWebView(token: token) }
            return
        }
        let js = """
            window.__fcmToken = '\(token)';
            window.dispatchEvent(new CustomEvent('fcmToken', { detail: { token: '\(token)' } }));
            console.log('FCM token injected into window:', '\(token)');
        """
        webView.evaluateJavaScript(js) { _, error in
            if let error = error { print("JS injection error: \(error)") }
            else { print("JS injection success!") }
        }
    }

    func debugLocalStorage(fcmToken: String) {
        guard let rootVC = window?.rootViewController,
              let webView = findWKWebView(in: rootVC.view) else { return }

        let js = """
            (() => {
                const keys = Object.keys(localStorage);
                console.log('All localStorage keys: ' + JSON.stringify(keys));
                const authKeys = keys.filter(k => k.includes('auth') || k.includes('supabase'));
                console.log('Auth-related keys: ' + JSON.stringify(authKeys));
                for (const key of authKeys) {
                    try {
                        const val = JSON.parse(localStorage.getItem(key) || '{}');
                        console.log('Key: ' + key + ' => user.id: ' + (val?.user?.id || 'none'));
                    } catch(e) {}
                }
                return keys.join(',');
            })()
        """
        webView.evaluateJavaScript(js) { result, error in
            print("localStorage debug result: \(result ?? "nil")")
            if let error = error { print("localStorage debug error: \(error)") }
        }
    }

    func saveFCMTokenToAPI(userId: String, fcmToken: String) {
        guard let url = URL(string: "https://wingspann.vercel.app/api/save-fcm-token") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["user_id": userId, "fcm_token": fcmToken]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error { print("API save error: \(error)") }
            else {
                let responseStr = String(data: data ?? Data(), encoding: .utf8) ?? ""
                print("FCM token saved via API: \(responseStr)")
            }
        }.resume()
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
