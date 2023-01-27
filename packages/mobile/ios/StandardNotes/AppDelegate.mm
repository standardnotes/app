#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <WebKit/WKWebsiteDataStore.h>
#import <TrustKit/TrustKit.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"StandardNotes";
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

- (void)disableUrlCache {
  // Disable NSURLCache for general network requests. Caches are not protected by NSFileProtectionComplete.
  // Disabling, or implementing a custom subclass are only two solutions. https://stackoverflow.com/questions/27933387/nsurlcache-and-data-protection
  NSURLCache *sharedCache = [[NSURLCache alloc] initWithMemoryCapacity:0 diskCapacity:0 diskPath:nil];
  [NSURLCache setSharedURLCache:sharedCache];
}

- (void)clearWebEditorCache {
  // Clear web editor cache after every app update
  NSString *lastVersionClearKey = @"lastVersionClearKey";
  NSString *lastVersionClear = [[NSUserDefaults standardUserDefaults] objectForKey:lastVersionClearKey];
  NSString *currentVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleShortVersionString"];
  if(![currentVersion isEqualToString:lastVersionClear]) {
    // UIWebView
    [[NSURLCache sharedURLCache] removeAllCachedResponses];

    // WebKit
    NSSet *websiteDataTypes = [WKWebsiteDataStore allWebsiteDataTypes];
    NSDate *dateFrom = [NSDate dateWithTimeIntervalSince1970:0];
    [[WKWebsiteDataStore defaultDataStore] removeDataOfTypes:websiteDataTypes modifiedSince:dateFrom completionHandler:^{}];

    [[NSUserDefaults standardUserDefaults] setObject:currentVersion forKey:lastVersionClearKey];
  }
}

- (void)configurePinning {
  if(@available(iOS 10, *)) {
    NSDictionary *trustKitConfig =
    @{
      kTSKSwizzleNetworkDelegates: @YES,

      // The list of domains we want to pin and their configuration
      kTSKPinnedDomains: @{
        @"standardnotes.org" : @{
          kTSKIncludeSubdomains:@YES,

          kTSKEnforcePinning:@YES,

          // Send reports for pin validation failures so we can track them
          kTSKReportUris: @[@"https://standard.report-uri.com/r/d/hpkp/reportOnly"],

          // The pinned public keys' Subject Public Key Info hashes
          kTSKPublicKeyHashes : @[
            @"Vjs8r4z+80wjNcr1YKepWQboSIRi63WsWXhIMN+eWys=",
            @"C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=",
            @"YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=",
            @"sRHdihwgkaib1P1gxX8HFszlD+7/gTfNvuAybgLPNis=",
            @"++MBgDH5WGvL9Bcn5Be30cRcL0f5O+NyoXuWtQdX1aI=",
            @"f0KW/FtqTjs108NpYj42SrGvOB2PpxIVM8nWxjPqJGE=",
            @"NqvDJlas/GRcYbcWE8S/IceH9cq77kg0jVhZeAPXq8k=",
            @"9+ze1cZgR9KO1kZrVDxA4HQ6voHRCSVNz4RdTCx4U8U="
          ],
        },
        @"standardnotes.com" : @{
          kTSKIncludeSubdomains:@YES,

          kTSKEnforcePinning:@YES,

          // Send reports for pin validation failures so we can track them
          kTSKReportUris: @[@"https://standard.report-uri.com/r/d/hpkp/reportOnly"],

          // The pinned public keys' Subject Public Key Info hashes
          kTSKPublicKeyHashes : @[
            @"Vjs8r4z+80wjNcr1YKepWQboSIRi63WsWXhIMN+eWys=",
            @"C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=",
            @"YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=",
            @"sRHdihwgkaib1P1gxX8HFszlD+7/gTfNvuAybgLPNis=",
            @"++MBgDH5WGvL9Bcn5Be30cRcL0f5O+NyoXuWtQdX1aI=",
            @"f0KW/FtqTjs108NpYj42SrGvOB2PpxIVM8nWxjPqJGE=",
            @"NqvDJlas/GRcYbcWE8S/IceH9cq77kg0jVhZeAPXq8k=",
            @"9+ze1cZgR9KO1kZrVDxA4HQ6voHRCSVNz4RdTCx4U8U="
          ],
        },
      }
    };

    [TrustKit initSharedInstanceWithConfiguration:trustKitConfig];
  }
}

@end
