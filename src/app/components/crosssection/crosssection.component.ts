import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
// Core
import { Node, StateChanges } from '@int/geotoolkit/scene/Node';
import { Plot } from '@int/geotoolkit/plot/Plot';
import { AutoModelLimitsStrategy } from '@int/geotoolkit/scene/AutoModelLimitsStrategy';

// Layout
import { CssLayout } from '@int/geotoolkit/layout/CssLayout';

// Axes
import { Axis } from '@int/geotoolkit/axis/Axis';
import { AdaptiveTickGenerator } from '@int/geotoolkit/axis/AdaptiveTickGenerator';
import { TickPosition, LabelPosition } from '@int/geotoolkit/axis/TickInfo';

// Responsive Style
import { ResponsiveStyle } from '@int/geotoolkit/responsive/ResponsiveStyle';

// Tools
import { RubberBand } from '@int/geotoolkit/controls/tools/RubberBand';
import { Events as RubberBandEvents } from '@int/geotoolkit/controls/tools/RubberBand';
import { Events as ToolsEvents } from '@int/geotoolkit/controls/tools/AbstractTool';
// Data
import { DataTable } from '@int/geotoolkit/data/DataTable';

// WellLog
import { LogVisualHeaderProvider } from '@int/geotoolkit/welllog/header/LogVisualHeaderProvider';
import { LogAxisVisualHeader, HeaderType } from '@int/geotoolkit/welllog/header/LogAxisVisualHeader';
import { AdaptiveLogCurveVisualHeader } from '@int/geotoolkit/welllog/header/AdaptiveLogCurveVisualHeader';

// Deviation
import { Trajectory2d } from '@int/geotoolkit/deviation/Trajectory2d';

// MultiWell
import { TrackType } from '@int/geotoolkit/welllog/multiwell/TrackType';
import { MultiWellWidget } from '@int/geotoolkit/welllog/multiwell/MultiWellWidget';
import { CorrelationTrack } from '@int/geotoolkit/welllog/multiwell/CorrelationTrack';

// Utils
import { AnchorType } from '@int/geotoolkit/util/AnchorType';
import { Orientation } from '@int/geotoolkit/util/Orientation';
import { Range } from '@int/geotoolkit/util/Range';
import { Rect } from '@int/geotoolkit/util/Rect';
import { log } from '@int/geotoolkit/base';
import { LogDataSource } from '../../data';
import { TemplateService } from '../../services/templateservice';
import { TrajectoryService } from 'src/app/services/trajectoryservice';
import { SeismicView } from './seismicview';
import { DeviatedLogView } from './deviatedlogview';
import { IWellTrack } from '@int/geotoolkit/welllog/multiwell/IWellTrack';
import {Group} from '@int/geotoolkit/scene/Group';

const TVDSStart = 2000;
const TVDSEnd = 2600;
const defaultCorrelationWidth = 800;
const seismicRange = new Range(104, 1075);
const modelGapY = 100;
const epsilon = 10e-10;
const originalScale = 2;
@Component({
  selector: 'app-crosssection-component',
  templateUrl: './crosssection.component.html',
  styleUrls: ['./crosssection.component.css']
})
export class CrosssectionComponent implements AfterViewInit {
  @ViewChild('plot', { static: true }) canvas: ElementRef;
  @ViewChild('parent', { static: true }) parent: ElementRef;
  private plot: Plot;
  private widget: MultiWellWidget;
  private horizontalScale = false;
  private desiredWidths = [];
  private resetLevels = false;
  constructor(private templateService: TemplateService, private trajectoryService: TrajectoryService) { }

  ngAfterViewInit(): void {
    this.init();
  }
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.resize();
  }
  zoomIn() {
    this.widget.scale(this.horizontalScale ? 2.0 : 1.0, 2.0);
  }
  zoomOut() {
    this.widget.scale(this.horizontalScale ? 0.5 : 1.0, 0.5);
  }
  fitToBounds() {
    const transform = this.widget.getTrackContainer().getLocalTransform();
    this.widget.scale(1.0 / Math.abs(transform.getScaleX()), 1. / Math.abs(transform.getScaleY()));
    this.widget.setCenterVisibleModelLimits(this.widget.getCenterModelLimits());
  }
  resetZoom() {
    const transform = this.widget.getTrackContainer().getLocalTransform();
    this.resetLevels = true;
    this.widget.scale(1.0 / Math.abs(transform.getScaleX()), originalScale / Math.abs(transform.getScaleY()));
    const tracksCount = this.widget.getTracksCount();
    let track;
    for (let i = 0; i < tracksCount; ++i) {
      track = this.widget.getTrackAt(i);
      if (this.desiredWidths[i]) {
        track.setDesiredWidth(this.desiredWidths[i]);
      }
    }
    this.widget.updateLayout();
    // workaround
    for (let i = 0; i < tracksCount; ++i) {
      track = this.widget.getTrackAt(i);
      if (!(track instanceof CorrelationTrack)) {
        track.fitToWidth();
      }
    }
    this.resetLevels = false;
  }
  doRubberBandZoom() {
    this.widget.getToolByName('panningTools').setEnabled(false);
    this.widget.getToolByName('rubberband').setEnabled(true);
  }
  private async init() {
    try {
      const tables = await this.initData() as DataTable[];
      this.configureHeaders();
      const widget = this.createWidget();
      this.initRubberBandTool(widget);
      this.setLevelOfDetails(widget);
      await this.addDefaultWellTemplate(widget, tables);
      this.initPlot(widget);
      this.resize();
      widget.scale(1, originalScale);
    } catch (error) {
      log(error);
    }
  }
  private async initData() {
    return await LogDataSource.getGeoServerData();
  }
  private configureHeaders() {
    const headerProvider = LogVisualHeaderProvider.getDefaultInstance();
    // configure Depth ant Time axis header
    const logAxisVisualHeader = headerProvider.getHeaderProvider('geotoolkit.welllog.LogAxis') as LogAxisVisualHeader;
    logAxisVisualHeader.setHeaderType(HeaderType.Simple);

    // configure curve header
    const header = new AdaptiveLogCurveVisualHeader()
      .setElement({
        'ScaleTo': { 'horizontalpos': 'right', 'verticalpos': 'top' },
        'ScaleFrom': { 'horizontalpos': 'left', 'verticalpos': 'top' },
        'Line': { 'horizontalpos': 'center', 'verticalpos': 'center' },
        'Name': { 'horizontalpos': 'center', 'verticalpos': 'top' },
        'Unit': { 'horizontalpos': 'center', 'verticalpos': 'bottom' },
        'Tracking': { 'horizontalpos': 'center', 'verticalpos': 'bottom' }
      });
    headerProvider.registerHeaderProvider('geotoolkit.welllog.CompositeLogCurve', header);
  }
  private initPlot(widget: MultiWellWidget) {
    this.plot = new Plot({
      'canvaselement': this.canvas.nativeElement,
      'root': widget
    });
    widget.invalidate();
    this.widget = widget;
  }
  private createWidget(): MultiWellWidget {
    let axisWest;
    let axisEast;
    const multiWellWidget = new MultiWellWidget({
      'viewcache': true,
      'header': {
        'border': {
          'visible': true
        },
        'viewcache': true,
        'height': 108
      },
      'footer': {
        'visible': 'none'
      },
      'track': {
        'header': {
          'border': {
            'visible': true
          }
        }
      },
      'annotations': {
        'north': [],
        'west': [
          axisWest = new Axis({
            'tickposition': TickPosition.Right,
            'labelposition': LabelPosition.Right,
            'orientation': Orientation.Vertical,
            'title': {
              'text': 'TVDSS',
              'visible': true,
              'textstyle': {
                'color': '#757575'
              },
              'alignment': AnchorType.LeftCenter
            }
          })
        ],
        'east': [
          axisEast = new Axis({
            'tickposition': TickPosition.Left,
            'labelposition': LabelPosition.Left,
            'orientation': Orientation.Vertical,
            'title': {
              'text': 'TVDSS',
              'visible': true,
              'textstyle': {
                'color': '#757575'
              },
              'alignment': AnchorType.RightCenter
            }
          })
        ]
      },
      'annotationssizes': {
        'north': 0,
        'south': 0,
        'west': 60,
        'east': 60
      }
    })
      .adjustPosition();
    multiWellWidget.connect(axisEast);
    multiWellWidget.connect(axisWest);
    return multiWellWidget;
  }
  private initRubberBandTool(widget) {
    const rubberBandTool = new RubberBand(widget.getTrackManipulatorLayer())
      .setEnabled(false)
      .on(ToolsEvents.onStateChanged, (event, sender) => {
        widget.getToolByName('panningTools').setEnabled(!sender.isEnabled());
        const wellToolsContainer = widget.getToolByName('well-tools');
        wellToolsContainer.setEnabled(!sender.isEnabled());
      })
      .on(RubberBandEvents.onZoomEnd, (event, sender, eventArgs) => {
        let newModelLimits = eventArgs.getArea();
        // convert to device coordinate
        newModelLimits = widget.getTrackManipulatorLayer().getSceneTransform().transformRect(newModelLimits);
        // convert to track container model
        newModelLimits = widget.getTrackContainer().getSceneTransform().inverseTransformRect(newModelLimits);
        widget.setCenterVisibleModelLimits(newModelLimits);
      });
    widget.getTool().insert(0, rubberBandTool);
  }
  private async addDefaultWellTemplate(widget: MultiWellWidget, data: DataTable[]) {
    const trajectoryData = await this.trajectoryService.getTrajectory('./assets/data/trajectory.json') as any[];
    const template = await this.templateService.getTemplate('./assets/data/template.json');
    const tvdssLimits = new Range(TVDSStart, TVDSEnd);
    // Create trajectory
    const arrayX = [];
    const arrayY = [];
    const arrayD = [];
    let j = 0;
    for (let i = 0; i < trajectoryData.length; ++i, ++j) {
      arrayX[j] = trajectoryData[i];
      arrayY[j] = trajectoryData[++i];
      arrayD[j] = trajectoryData[++i];
    }
    const minDepth = arrayD[0];
    const maxDepth = arrayD[arrayD.length - 1];
    const trajectory = new Trajectory2d(arrayX, arrayY, arrayD);
    const modelLimits = new Rect(trajectory.getMinX(), trajectory.getMinY() - modelGapY,
      trajectory.getMaxX(), trajectory.getMaxY() + modelGapY);
    j = 0;
    // Add wells and seismic panels
    let well = this.addWell(widget, new LogDataSource(data[0]),
      new Range(tvdssLimits.getLow(), tvdssLimits.getHigh()), template, '#Well 1') as any;
    this.desiredWidths[j++] = well.getDesiredWidth();
    let panel = widget.addTrack(TrackType.CorrelationTrack, {
      'width': defaultCorrelationWidth
    }) as CorrelationTrack;
    this.desiredWidths[j++] = defaultCorrelationWidth;
    this.addSeismic(panel, seismicRange.getLow(), seismicRange.getHigh() / 2,
      modelLimits.clone().setWidth(modelLimits.getCenterX() - modelLimits.getX()));
    this.addDeviatedLog(panel, trajectory, new LogDataSource(data[1]), minDepth, maxDepth);
    this.addPanelHeader(widget, panel, modelLimits.getX(), Math.ceil(modelLimits.getCenterX()));
    well = this.addWell(widget, new LogDataSource(data[1]),
      new Range(tvdssLimits.getLow(), tvdssLimits.getHigh()), template, '#Well 2');
    this.desiredWidths[j++] = well.getDesiredWidth();
    panel = widget.addTrack(TrackType.CorrelationTrack, {
      'width': defaultCorrelationWidth
    }) as CorrelationTrack;
    this.desiredWidths[j++] = defaultCorrelationWidth;
    this.addSeismic(panel, seismicRange.getHigh() / 2 + 1, seismicRange.getHigh(),
      modelLimits.clone().setX(modelLimits.getCenterX() + 1).setWidth(modelLimits.getWidth() / 2));
    this.addDeviatedLog(panel, trajectory, new LogDataSource(data[1]), minDepth, maxDepth);
    this.addPanelHeader(widget, panel, Math.floor(modelLimits.getCenterX()), Math.ceil(modelLimits.getRight()));
    well = this.addWell(widget, new LogDataSource(data[2]),
      new Range(tvdssLimits.getLow(), tvdssLimits.getHigh()), template, '#Well 3');
    this.desiredWidths[j++] = well.getDesiredWidth();
  }
  private addWell(widget: MultiWellWidget, datasource: LogDataSource,
    depthrange: Range, template: any, title: string) {
    const well = widget.addTrack(TrackType.WellTrack, {
      'width': 0,
      'range': depthrange,
      'welllog': {
        'range': depthrange,
        'viewcache': false
      },
      'title': title
    }) as IWellTrack;
    well.setDataBinding(datasource.getDataBinding());
    well.setData(datasource);
    well.loadTemplate(JSON.stringify(template));
    return well;
  }
  private addSeismic(track: CorrelationTrack, startX: number, endX: number, modelRect: Rect) {
    const seismic = new SeismicView(startX, endX);
    track.setModelLimits(modelRect);
    track.enableClipping(true);
    const image = seismic.getImage();
    image.setBounds(modelRect);
    track.addChild(image);
  }
  private addPanelHeader(widget: MultiWellWidget, track: CorrelationTrack, start: number, end: number) {
    const headerGroup = widget.getTrackHeader(track);
    if (headerGroup instanceof Group) {
      headerGroup.setLayout(new CssLayout());
      headerGroup.setModelLimits(new Rect(start, 0, end, 1));
      headerGroup.setAutoModelLimitsStrategy(new AutoModelLimitsStrategy(false, true));
    }
    headerGroup.enableClipping(true);
    const tickGenerator = new AdaptiveTickGenerator();
    tickGenerator.getTickStyle('major').setColor('#ededed');
    tickGenerator.getTickStyle('minor').setColor('#ededed');
    tickGenerator.setVisibleTickGrade('edge', false);
    const axis = new Axis({
      'tickposition': TickPosition.Bottom,
      'orientation': Orientation.Horizontal,
      'labelposition': LabelPosition.Bottom,
      'tickgenerator': tickGenerator
    });
    axis.setLayoutStyle({ 'height': 150, 'bottom': 0, 'left': 0, 'right': 0 });
    headerGroup.addChild(axis);
  }
  private addDeviatedLog(track: CorrelationTrack, trajectory: Trajectory2d,
    dataSource: LogDataSource, minDepth: number, maxDepth: number) {
    const logview = new DeviatedLogView(trajectory, dataSource, minDepth, maxDepth);
    track.addChild(logview.getWell());
  }
  private setLevelOfDetails(widget: MultiWellWidget) {
    const rules = [{
      'condition': (node) => {
        const transform = node.getSceneTransform();
        return Math.abs(transform.getScaleX() + epsilon) < 1;
      },
      'restore': false,
      'css': [
        '*[cssclass="INDEX_TRACK"] {',
        '   visible: false;',
        '}',
        '.LogVisualHeader {',
        '   visible: false;',
        '}',
        '*[cssclass="horizontalGrid"] {',
        '   visible: false;',
        '}',
        '*[cssclass="verticalGrid"] {',
        '   visible: false;',
        '}',
        '.LogTrack {',
        '   border-visible: true;',
        '}',
        '.LogMarker {',
        '   visiblenamelabel: false;',
        '   visibledepthlabel: false;',
        '   textstyle-font: 15px sans-serif',
        '}',
        '.WellTrackVisualHeader {',
        '   visible: true;',
        '}',
        '.MultiWellWidget {',
        '   tops-visible: true;',
        '   tops-alignment: ' + AnchorType.LeftTop + ';',
        '}',
        '.LogTrackContainer {',
        '   viewcache: false',
        '}',
        '.WellContainer {',
        '   viewcache: true',
        '}'
      ].join('\n')
    }, {
      'condition': (node) => {
        const transform = node.getSceneTransform();
        return Math.abs(transform.getScaleX() + epsilon) >= 1 || this.resetLevels;
      },
      'restore': false,
      'css': [
        '*[cssclass="INDEX_TRACK"] {',
        '   visible: true;',
        '}',
        '.LogVisualHeader {',
        '   visible: true;',
        '}',
        '*[cssclass="horizontalGrid"] {',
        '   visible: true;',
        '}',
        '*[cssclass="verticalGrid"] {',
        '   visible: true;',
        '}',
        '.LogTrack {',
        '   border-visible: true;',
        '}',
        '.LogMarker {',
        '   visiblenamelabel: true;',
        '   visibledepthlabel: true;',
        '   textstyle-font: 12px sans-serif',
        '}',
        '.MultiWellWidget {',
        '   tops-visible: false',
        '}',
        '.LogTrackContainer {',
        '   viewcache: true',
        '}',
        '.WellContainer {',
        '   viewcache: false',
        '}'
      ].join('\n')
    }];
    widget.getTrackContainer().setResponsiveStyle(new ResponsiveStyle({
      'rules': rules,
      'target': widget,
      'start': () => {
        Node.enableSceneGraphNotification(false);
      },
      'end': () => {
        Node.enableSceneGraphNotification(true);
        widget.updateState(undefined, StateChanges.Rebuild);
      }
    }));
  }
  private resize() {
    if (this.plot) {
      this.plot.setSize(this.parent.nativeElement.clientWidth, this.parent.nativeElement.clientHeight);
    }
  }
}
