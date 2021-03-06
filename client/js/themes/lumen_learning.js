"use strict";
import defines from "./defines";

export default {
  titleBarBackgroundColor: defines.lightgray,
  progressBarColor: defines.lumenSeafoam,
  progressBarHeight: "10px",
  assessmentContainerBoxShadow: "1px 4px 4px 4px rgba(0,0,0,0.2)",
  assessmentContainerBorderRadius: "4px",
  headerBackgroundColor: defines.white,
  confidenceWrapperBorder: "1px solid rgba(0,0,0,0.2)",

  fullQuestionBackgroundColor: defines.white,
  panelHeadingBackgroundColor: defines.white,
  panelBoxShadow: "0 0 0 rgba(0,0,0,0.0)",
  panelBorder: null,
  panelBorderRadius: null,
  panelBorderColor: "transparent",
  panelMarginBottom: "-30px",
  maybeBackgroundColor: defines.lumenRed + " !important",
  maybeColor: defines.white,
  probablyBackgroundColor: defines.lumenSeafoam + " !important",
  probablyColor: defines.white,
  definitelyBackgroundColor: defines.lumenBlue + " !important",
  definitelyColor: defines.white,
  confidenceWrapperBackgroundColor: defines.lightergray,

  assessmentPadding: "20px",
  assessmentBackground: defines.white,

  progressDropdownBoxShadow: "0px 0px 20px 0px rgba(0,0,0,0.2)",

  shouldShowAttempts: false,
  shouldShowProgressText: true,
  shouldShowCounter: true,
  shouldShowNextPrevious: true,
  shouldShowFooter: false,

  correctBackgroundColor: "rgba(113, 184, 137, 0.2)",
  submitBackgroundColor: "#9B59B6",
  incorrectBackgroundColor: "rgba(207, 0, 0, 0.2)",
  correctBorder: "1px solid rgb(113, 184, 137)",
  correctColor:  "rgb(113, 184, 137)",
  incorrectBorder: "1px solid rgb(207, 0, 0)",
  incorrectColor: "rgb(207, 0, 0)",
  partialBorder: "1px solid rgb(200, 133, 51)",
  partialBackgroundColor: "rgba(200, 133, 51, .2)",
  partialColor: "rgb(200, 133, 51)",
  outcomesBackgroundColor: "rgba(204, 204, 204, .2)",
}
