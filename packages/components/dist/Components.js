"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Components = void 0;
var BaseEditorStaticFiles = ['index.html', 'dist', 'package.json'];
var BaseThemeStaticFiles = ['dist', 'package.json'];
var Editors = [
    {
        identifier: 'org.standardnotes.advanced-checklist',
        path: 'Editors/org.standardnotes.advanced-checklist',
        static_files: __spreadArray(__spreadArray([], BaseEditorStaticFiles, true), ['build'], false),
    },
    {
        identifier: 'org.standardnotes.code-editor',
        path: 'Editors/org.standardnotes.code-editor',
        static_files: __spreadArray(__spreadArray([], BaseEditorStaticFiles, true), ['vendor'], false),
    },
    {
        identifier: 'org.standardnotes.markdown-visual-editor',
        path: 'Editors/org.standardnotes.markdown-visual-editor',
        static_files: __spreadArray(__spreadArray([], BaseEditorStaticFiles, true), ['build'], false),
    },
    {
        identifier: 'org.standardnotes.plus-editor',
        path: 'Editors/org.standardnotes.plus-editor',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.standard-sheets',
        path: 'Editors/org.standardnotes.standard-sheets',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.token-vault',
        path: 'Editors/org.standardnotes.token-vault',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.simple-task-editor',
        path: 'Editors/org.standardnotes.simple-task-editor',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.advanced-markdown-editor',
        path: 'Editors/org.standardnotes.advanced-markdown-editor',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
];
var DeprecatedEditors = [
    {
        identifier: 'org.standardnotes.bold-editor',
        path: 'Deprecated/org.standardnotes.bold-editor',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.simple-markdown-editor',
        path: 'Deprecated/org.standardnotes.simple-markdown-editor',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.fancy-markdown-editor',
        path: 'Deprecated/org.standardnotes.fancy-markdown-editor',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.minimal-markdown-editor',
        path: 'Deprecated/org.standardnotes.minimal-markdown-editor',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
    {
        identifier: 'org.standardnotes.file-safe',
        path: 'Deprecated/org.standardnotes.file-safe',
        static_files: __spreadArray([], BaseEditorStaticFiles, true),
    },
];
var Themes = [
    {
        identifier: 'org.standardnotes.theme-autobiography',
        path: 'Themes/org.standardnotes.theme-autobiography',
        static_files: BaseThemeStaticFiles,
    },
    {
        identifier: 'org.standardnotes.theme-dynamic',
        path: 'Themes/org.standardnotes.theme-dynamic',
        static_files: BaseThemeStaticFiles,
    },
    {
        identifier: 'org.standardnotes.theme-focus',
        path: 'Themes/org.standardnotes.theme-focus',
        static_files: BaseThemeStaticFiles,
    },
    {
        identifier: 'org.standardnotes.theme-futura',
        path: 'Themes/org.standardnotes.theme-futura',
        static_files: BaseThemeStaticFiles,
    },
    {
        identifier: 'org.standardnotes.theme-midnight',
        path: 'Themes/org.standardnotes.theme-midnight',
        static_files: BaseThemeStaticFiles,
    },
    {
        identifier: 'org.standardnotes.theme-titanium',
        path: 'Themes/org.standardnotes.theme-titanium',
        static_files: BaseThemeStaticFiles,
    },
    {
        identifier: 'org.standardnotes.theme-solarized-dark',
        path: 'Themes/org.standardnotes.theme-solarized-dark',
        static_files: BaseThemeStaticFiles,
    },
];
var Components = __spreadArray(__spreadArray(__spreadArray([], Editors, true), DeprecatedEditors, true), Themes, true);
exports.Components = Components;
