/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */
/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   Sanitizes an html string by stripping all potentially dangerous tokens.
 *
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to a properly escaped HTML string. This means that no unsafe input can make
 *   it into the returned string.
 *
 *   The whitelist for URL sanitization of attribute values is configured using the functions
 *   `aHrefSanitizationWhitelist` and `imgSrcSanitizationWhitelist` of {@link $compileProvider}.
 *
 *   The input may also contain SVG markup if this is enabled via {@link $sanitizeProvider}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 * @example
   <example module="sanitizeExample" deps="angular-sanitize.js" name="sanitize-service">
   <file name="index.html">
     <script>
         angular.module('sanitizeExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */
/**
 * @ngdoc provider
 * @name $sanitizeProvider
 * @this
 *
 * @description
 * Creates and configures {@link $sanitize} instance.
 */
declare function $SanitizeProvider(): void;
declare class $SanitizeProvider {
    $get: (string | (($$sanitizeUri: any) => (html: any) => string))[];
    /**
     * @ngdoc method
     * @name $sanitizeProvider#enableSvg
     * @kind function
     *
     * @description
     * Enables a subset of svg to be supported by the sanitizer.
     *
     * <div class="alert alert-warning">
     *   <p>By enabling this setting without taking other precautions, you might expose your
     *   application to click-hijacking attacks. In these attacks, sanitized svg elements could be positioned
     *   outside of the containing element and be rendered over other elements on the page (e.g. a login
     *   link). Such behavior can then result in phishing incidents.</p>
     *
     *   <p>To protect against these, explicitly setup `overflow: hidden` css rule for all potential svg
     *   tags within the sanitized content:</p>
     *
     *   <br>
     *
     *   <pre><code>
     *   .rootOfTheIncludedContent svg {
     *     overflow: hidden !important;
     *   }
     *   </code></pre>
     * </div>
     *
     * @param {boolean=} flag Enable or disable SVG support in the sanitizer.
     * @returns {boolean|$sanitizeProvider} Returns the currently configured value if called
     *    without an argument or self for chaining otherwise.
     */
    enableSvg: (enableSvg: any) => boolean | any;
    /**
     * @ngdoc method
     * @name $sanitizeProvider#addValidElements
     * @kind function
     *
     * @description
     * Extends the built-in lists of valid HTML/SVG elements, i.e. elements that are considered safe
     * and are not stripped off during sanitization. You can extend the following lists of elements:
     *
     * - `htmlElements`: A list of elements (tag names) to extend the current list of safe HTML
     *   elements. HTML elements considered safe will not be removed during sanitization. All other
     *   elements will be stripped off.
     *
     * - `htmlVoidElements`: This is similar to `htmlElements`, but marks the elements as
     *   "void elements" (similar to HTML
     *   [void elements](https://rawgit.com/w3c/html/html5.1-2/single-page.html#void-elements)). These
     *   elements have no end tag and cannot have content.
     *
     * - `svgElements`: This is similar to `htmlElements`, but for SVG elements. This list is only
     *   taken into account if SVG is {@link ngSanitize.$sanitizeProvider#enableSvg enabled} for
     *   `$sanitize`.
     *
     * <div class="alert alert-info">
     *   This method must be called during the {@link angular.Module#config config} phase. Once the
     *   `$sanitize` service has been instantiated, this method has no effect.
     * </div>
     *
     * <div class="alert alert-warning">
     *   Keep in mind that extending the built-in lists of elements may expose your app to XSS or
     *   other vulnerabilities. Be very mindful of the elements you add.
     * </div>
     *
     * @param {Array<String>|Object} elements - A list of valid HTML elements or an object with one or
     *   more of the following properties:
     *   - **htmlElements** - `{Array<String>}` - A list of elements to extend the current list of
     *     HTML elements.
     *   - **htmlVoidElements** - `{Array<String>}` - A list of elements to extend the current list of
     *     void HTML elements; i.e. elements that do not have an end tag.
     *   - **svgElements** - `{Array<String>}` - A list of elements to extend the current list of SVG
     *     elements. The list of SVG elements is only taken into account if SVG is
     *     {@link ngSanitize.$sanitizeProvider#enableSvg enabled} for `$sanitize`.
     *
     * Passing an array (`[...]`) is equivalent to passing `{htmlElements: [...]}`.
     *
     * @return {$sanitizeProvider} Returns self for chaining.
     */
    addValidElements: (elements: Array<string> | Object) => any;
    /**
     * @ngdoc method
     * @name $sanitizeProvider#addValidAttrs
     * @kind function
     *
     * @description
     * Extends the built-in list of valid attributes, i.e. attributes that are considered safe and are
     * not stripped off during sanitization.
     *
     * **Note**:
     * The new attributes will not be treated as URI attributes, which means their values will not be
     * sanitized as URIs using `$compileProvider`'s
     * {@link ng.$compileProvider#aHrefSanitizationWhitelist aHrefSanitizationWhitelist} and
     * {@link ng.$compileProvider#imgSrcSanitizationWhitelist imgSrcSanitizationWhitelist}.
     *
     * <div class="alert alert-info">
     *   This method must be called during the {@link angular.Module#config config} phase. Once the
     *   `$sanitize` service has been instantiated, this method has no effect.
     * </div>
     *
     * <div class="alert alert-warning">
     *   Keep in mind that extending the built-in list of attributes may expose your app to XSS or
     *   other vulnerabilities. Be very mindful of the attributes you add.
     * </div>
     *
     * @param {Array<String>} attrs - A list of valid attributes.
     *
     * @returns {$sanitizeProvider} Returns self for chaining.
     */
    addValidAttrs: (attrs: Array<string>) => any;
}
declare function sanitizeText(chars: any): string;
declare var $sanitizeMinErr: any;
declare var bind: any;
declare var extend: any;
declare var forEach: any;
declare var isArray: any;
declare var isDefined: any;
declare var lowercase: any;
declare var noop: any;
declare var nodeContains: any;
declare var htmlParser: any;
declare var htmlSanitizeWriter: any;
