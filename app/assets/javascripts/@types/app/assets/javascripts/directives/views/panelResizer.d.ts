export class PanelResizer {
    restrict: string;
    template: any;
    controller: typeof PanelResizerCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        alwaysVisible: string;
        collapsable: string;
        control: string;
        defaultWidth: string;
        hoverable: string;
        index: string;
        minWidth: string;
        onResizeFinish: string;
        panelId: string;
        property: string;
    };
}
declare class PanelResizerCtrl {
    constructor($compile: any, $element: any, $timeout: any);
    $compile: any;
    $element: any;
    $timeout: any;
    handleResize(): void;
    onMouseMove(event: any): void;
    onMouseUp(): void;
    onMouseDown(event: any): void;
    $onInit(): void;
    $onDestroy(): void;
    onResizeFinish: any;
    control: any;
    configureControl(): void;
    configureDefaults(): void;
    panel: HTMLElement | null | undefined;
    resizerColumn: any;
    currentMinWidth: any;
    pressed: boolean | undefined;
    startWidth: any;
    lastDownX: any;
    collapsed: boolean | undefined;
    lastWidth: any;
    startLeft: number | undefined;
    lastLeft: any;
    appFrame: DOMRect | null | undefined;
    widthBeforeLastDblClick: any;
    configureRightPanel(): void;
    getParentRect(): any;
    reloadDefaultValues(): void;
    addDoubleClickHandler(): void;
    addMouseDownListener(): void;
    addMouseMoveListener(): void;
    handleWidthEvent(event: any): void;
    handleLeftEvent(event: any): void;
    addMouseUpListener(): void;
    isAtMaxWidth(): any;
    isCollapsed(): boolean;
    setWidth(width: any, finish: any): void;
    setLeft(left: any): void;
    finishSettingWidth(): void;
    /**
     * If an iframe is displayed adjacent to our panel, and the mouse exits over the iframe,
     * document[onmouseup] is not triggered because the document is no longer the same over
     * the iframe. We add an invisible overlay while resizing so that the mouse context
     * remains in our main document.
     */
    addInvisibleOverlay(): void;
    overlay: any;
    removeInvisibleOverlay(): void;
    flash(): void;
}
export {};
