import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import WebKit
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    private var pendingFcmToken: String?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        pendingFcmToken = token
        injectPendingTokenIntoWebView()
    }

    func findWKWebView(in view: UIView) -> WKWebView? {
        if let webView = view as? WKWebView { return webView }
        for subview in view.subviews {
            if let found = findWKWebView(in: subview) { return found }
        }
        return nil
    }

    private func injectPendingTokenIntoWebView() {
        guard let token = pendingFcmToken else { return }
        guard let rootVC = window?.rootViewController,
              let webView = findWKWebView(in: rootVC.view) else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { self.injectPendingTokenIntoWebView() }
            return
        }

        // Wrap token in JSON string to avoid breaking JavaScript for special characters.
        guard let tokenData = try? JSONSerialization.data(withJSONObject: [token], options: []),
              let tokenArrayJson = String(data: tokenData, encoding: .utf8),
              tokenArrayJson.count >= 2 else {
            return
        }
        let jsonToken = String(tokenArrayJson.dropFirst().dropLast())
        let js = """
            window.dispatchEvent(new CustomEvent('fcmToken', { detail: { token: \(jsonToken) } }));
        """
        webView.evaluateJavaScript(js) { _, error in
            if let error = error {
                print("JS token injection error: \(error)")
                return
            }
            self.pendingFcmToken = nil
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        Messaging.messaging().appDidReceiveMessage(userInfo)
        completionHandler(.newData)
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {
        injectPendingTokenIntoWebView()
    }
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
