/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces UG (haftungsbeschraenkt)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import React, { useState } from 'react';
import { v1 as uuidv1 } from 'uuid';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import ToggleButton from '@material-ui/lab/ToggleButton';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import ThemingIcon from '@material-ui/icons/InvertColors';
import LocationsIcon from '@material-ui/icons/WorkOutline';
import CreateIcon from '@material-ui/icons/Add';
import TagLibraryIcon from '@material-ui/icons/LocalOfferOutlined';
import RecentThingsIcon from '@material-ui/icons/History';
import HelpIcon from '@material-ui/icons/HelpOutline';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import { CognitoUserInterface } from '@aws-amplify/ui-components';
import CloseIcon from '@material-ui/icons/Close';
import ProTeaser from '../assets/images/spacerocket_undraw.svg';
import ProTeaserImage from '-/assets/images/pro-teaser.svg';
import ProTextLogo from '../assets/images/text-logo-pro.svg';
import { Pro } from '-/pro';
import CustomLogo from './CustomLogo';
import TagLibrary from '../components/TagLibrary';
import LocationManager from '../components/LocationManager';
import HelpFeedbackPanel from '../components/HelpFeedbackPanel';
import i18n from '../services/i18n';
import {
  actions as AppActions,
  isSettingsDialogOpened,
  isLocationManagerPanelOpened,
  isTagLibraryPanelOpened,
  isSearchPanelOpened,
  isHelpFeedbackPanelOpened,
  isReadOnlyMode,
  getDirectoryPath
} from '../reducers/app';
import LoadingLazy from './LoadingLazy';
import { actions as SettingsActions, isFirstRun } from '../reducers/settings';
import Links from '-/links';
import StoredSearches from '-/components/StoredSearches';
import Popover from '@material-ui/core/Popover';
import UserDetailsPopover from '-/components/UserDetailsPopover';

const styles: any = (theme: any) => ({
  selectedButton: {
    backgroundColor: theme.palette.primary.light
  }
});

const ProTeaserDialog = React.lazy(() =>
  import(/* webpackChunkName: "ProTeaserDialog" */ './dialogs/ProTeaserDialog')
);
const ProTeaserDialogAsync = props => (
  <React.Suspense fallback={<LoadingLazy />}>
    <ProTeaserDialog {...props} />
  </React.Suspense>
);

interface Props {
  classes: any;
  isFirstRun: boolean;
  setFirstRun: (isFirstRun: boolean) => void;
  toggleOnboardingDialog: () => void;
  toggleCreateFileDialog: () => void;
  toggleAboutDialog: () => void;
  toggleKeysDialog: () => void;
  toggleSettingsDialog: () => void;
  isSettingsDialogOpened: () => void;
  isLocationManagerPanelOpened: boolean;
  openLocationManagerPanel: () => void;
  isTagLibraryPanelOpened: boolean;
  openTagLibraryPanel: () => void;
  isSearchPanelOpened: boolean;
  openSearchPanel: () => void;
  isHelpFeedbackPanelOpened: boolean;
  openHelpFeedbackPanel: () => void;
  // closeAllVerticalPanels: () => void;
  toggleLocationDialog: () => void;
  openURLExternally: (url: string, skipConfirmation?: boolean) => void;
  switchTheme: () => void;
  hideDrawer?: () => void;
  isReadOnlyMode: boolean;
  showNotification: (message: string) => void;
  directoryPath: string;
  user: CognitoUserInterface;
  width?: number;
  theme: any;
}

const MobileNavigation = (props: Props) => {
  const [isProTeaserVisible, setIsProTeaserVisible] = useState<boolean>(false);
  const [showTeaserBanner, setShowTeaserBanner] = useState<boolean>(false);
  const [anchorUser, setAnchorUser] = useState<HTMLButtonElement | null>(null);

  const toggleProTeaser = () => {
    setIsProTeaserVisible(!isProTeaserVisible);
  };

  const showProTeaser = !Pro && showTeaserBanner;

  const {
    classes,
    toggleCreateFileDialog,
    toggleOnboardingDialog,
    toggleSettingsDialog,
    toggleKeysDialog,
    toggleAboutDialog,
    openLocationManagerPanel,
    openTagLibraryPanel,
    openSearchPanel,
    openHelpFeedbackPanel,
    showNotification,
    hideDrawer,
    openURLExternally,
    directoryPath,
    width,
    theme,
    switchTheme,
    user
  } = props;
  return (
    <div
      className={classes.root}
      style={{
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        overflow: 'hidden',
        width: width || 320,
        maxWidth: width || 320
      }}
    >
      <div
        style={{
          overflow: 'hidden',
          height: showProTeaser ? 'calc(100% - 220px)' : 'calc(100% - 55px)'
        }}
      >
        <CustomLogo />
        <ButtonGroup
          // variant="text"
          color="primary"
          aria-label="text primary button group"
          style={{
            textAlign: 'center',
            display: 'block',
            whiteSpace: 'nowrap',
            marginBottom: 20
          }}
        >
          <Tooltip title={i18n.t('core:createFileTitle')}>
            <Button
              data-tid="createNewFileTID"
              onClick={() => {
                if (props.isReadOnlyMode || !directoryPath) {
                  showNotification(
                    'You are in read-only mode or there is no opened location'
                  );
                } else {
                  toggleCreateFileDialog();
                  hideDrawer();
                }
              }}
              size="small"
              color="primary"
            >
              <CreateIcon />
              &nbsp;
              {i18n.t('core:new')}
            </Button>
          </Tooltip>
          <Tooltip title={i18n.t('core:createLocationTitle')}>
            <Button
              data-tid="createNewLocation"
              onClick={props.toggleLocationDialog}
              size="small"
              color="primary"
            >
              <LocationsIcon />
              &nbsp;
              <span
                style={{
                  maxWidth: 150,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {i18n.t('core:createLocationTitle')}
              </span>
            </Button>
          </Tooltip>
        </ButtonGroup>
        <LocationManager
          reduceHeightBy={180}
          show={props.isLocationManagerPanelOpened}
        />
        {props.isTagLibraryPanelOpened && <TagLibrary reduceHeightBy={180} />}
        {props.isSearchPanelOpened && <StoredSearches reduceHeightBy={120} />}
        {props.isHelpFeedbackPanelOpened && (
          <HelpFeedbackPanel
            reduceHeightBy={180}
            openURLExternally={openURLExternally}
            toggleAboutDialog={toggleAboutDialog}
            toggleKeysDialog={toggleKeysDialog}
            toggleOnboardingDialog={toggleOnboardingDialog}
            toggleProTeaser={toggleProTeaser}
          />
        )}
      </div>
      <div
        style={{
          textAlign: 'center'
        }}
      >
        {showProTeaser && (
          <>
            <CardContent
              onClick={toggleProTeaser}
              style={{
                padding: 5,
                paddingBottom: 0,
                textAlign: 'center'
              }}
            >
              <Typography color="textSecondary" variant="caption">
                achieve more with
                <IconButton
                  style={{ right: 5, marginTop: -10, position: 'absolute' }}
                  size="small"
                  aria-label="close"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowTeaserBanner(false);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Typography>
              <br />
              <img style={{ height: 35 }} src={ProTextLogo} alt="" />
              <br />
              <img style={{ maxHeight: 60 }} src={ProTeaserImage} alt="" />
            </CardContent>
            <CardActions
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: -10
              }}
            >
              <Button
                size="small"
                onClick={(event: any) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleProTeaser();
                }}
              >
                {i18n.t('showMeMore')}
              </Button>
              <Button
                size="small"
                onClick={(event: any) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openURLExternally(Links.links.productsOverview, true);
                }}
              >
                {i18n.t('getItNow')}
              </Button>
            </CardActions>
          </>
        )}
        <Tooltip title={i18n.t('core:settings')}>
          <IconButton
            id="verticalNavButton"
            data-tid="settings"
            onClick={() => {
              toggleSettingsDialog();
            }}
            style={{ marginTop: -15, marginRight: 2 }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <ToggleButtonGroup exclusive>
          <Tooltip title={i18n.t('core:locationManager')}>
            <ToggleButton
              onClick={openLocationManagerPanel}
              className={
                props.isLocationManagerPanelOpened
                  ? classNames(classes.button, classes.selectedButton)
                  : classes.button
              }
              data-tid="locationManager"
            >
              <LocationsIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={i18n.t('core:tagLibrary')}>
            <ToggleButton
              data-tid="tagLibrary"
              onClick={openTagLibraryPanel}
              className={
                props.isTagLibraryPanelOpened
                  ? classNames(classes.button, classes.selectedButton)
                  : classes.button
              }
            >
              <TagLibraryIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={i18n.t('core:searchTitle')}>
            <ToggleButton
              data-tid="search"
              onClick={openSearchPanel}
              className={
                props.isSearchPanelOpened
                  ? classNames(classes.button, classes.selectedButton)
                  : classes.button
              }
            >
              <RecentThingsIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={i18n.t('core:helpFeedback')}>
            <ToggleButton
              data-tid="helpFeedback"
              onClick={openHelpFeedbackPanel}
              className={
                props.isHelpFeedbackPanelOpened
                  ? classNames(classes.button, classes.selectedButton)
                  : classes.button
              }
            >
              <HelpIcon />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
        {user ? (
          <>
            <Tooltip title={i18n.t('core:userAccount')}>
              <IconButton
                data-tid="accountCircleIconTID"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                  setAnchorUser(event.currentTarget)
                }
                style={{ marginTop: -15, marginRight: 2 }}
              >
                <AccountCircleIcon className={classes.buttonIcon} />
              </IconButton>
            </Tooltip>
            <Popover
              open={Boolean(anchorUser)}
              anchorEl={anchorUser}
              onClose={() => setAnchorUser(null)}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'center'
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center'
              }}
            >
              <UserDetailsPopover onClose={() => setAnchorUser(null)} />
            </Popover>
          </>
        ) : (
          <Tooltip title={i18n.t('core:switchTheme')}>
            <IconButton
              data-tid="switchTheme"
              onClick={switchTheme}
              style={{ marginTop: -15, marginRight: 2 }}
            >
              <ThemingIcon className={classes.buttonIcon} />
            </IconButton>
          </Tooltip>
        )}
        {isProTeaserVisible && (
          <ProTeaserDialogAsync
            open={isProTeaserVisible}
            onClose={toggleProTeaser}
            openURLExternally={openURLExternally}
            key={uuidv1()} // TODO rethink to remove this
          />
        )}
      </div>
    </div>
  );
};

function mapStateToProps(state) {
  return {
    isFirstRun: isFirstRun(state),
    isSettingsDialogOpened: isSettingsDialogOpened(state),
    isLocationManagerPanelOpened: isLocationManagerPanelOpened(state),
    isTagLibraryPanelOpened: isTagLibraryPanelOpened(state),
    isSearchPanelOpened: isSearchPanelOpened(state),
    isHelpFeedbackPanelOpened: isHelpFeedbackPanelOpened(state),
    isReadOnlyMode: isReadOnlyMode(state),
    directoryPath: getDirectoryPath(state),
    user: state.app.user
  };
}

function mapActionCreatorsToProps(dispatch) {
  return bindActionCreators(
    {
      toggleCreateFileDialog: AppActions.toggleCreateFileDialog,
      toggleOnboardingDialog: AppActions.toggleOnboardingDialog,
      toggleSettingsDialog: AppActions.toggleSettingsDialog,
      toggleAboutDialog: AppActions.toggleAboutDialog,
      toggleKeysDialog: AppActions.toggleKeysDialog,
      openLocationManagerPanel: AppActions.openLocationManagerPanel,
      openTagLibraryPanel: AppActions.openTagLibraryPanel,
      openSearchPanel: AppActions.openSearchPanel,
      toggleLocationDialog: AppActions.toggleLocationDialog,
      openHelpFeedbackPanel: AppActions.openHelpFeedbackPanel,
      openURLExternally: AppActions.openURLExternally,
      showNotification: AppActions.showNotification,
      // closeAllVerticalPanels: AppActions.closeAllVerticalPanels,
      switchTheme: SettingsActions.switchTheme,
      setFirstRun: SettingsActions.setFirstRun
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapActionCreatorsToProps
)(withStyles(styles, { withTheme: true })(MobileNavigation));
