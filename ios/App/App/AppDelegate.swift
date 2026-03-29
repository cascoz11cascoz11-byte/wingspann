import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    var pendingFCMToken: String?

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
        pendingFCMToken = token
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
            self.injectTokenIntoWebView(token: token)
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
        guard let rootVC = window?.rootViewController else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { self.injectTokenIntoWebView(token: token) }
            return
        }
        guard let webView = findWKWebView(in: rootVC.view) else {
            print("WKWebView not found, retrying...")
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { self.injectTokenIntoWebView(token: token) }
            return
        }
        // Store on window AND dispatch event
        let js = """
            window.__fcmToken = '\(token)';
            window.dispatchEvent(new CustomEvent('fcmToken', { detail: { token: '\(token)' } }));
            console.log('FCM token injected into window:', '\(token)');
        """
        webView.evaluateJavaScript(js) { result, error in
            if let error = error {
                print("JS injection error: \(error)")
            } else {
                print("JS injection success!")
            }
        }
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
