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

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ShowEntriesWithTagIcon from '@mui/icons-material/SearchOutlined';
import ApplyTagIcon from '@mui/icons-material/LocalOfferOutlined';
import Edit from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { actions as LocationIndexActions } from '-/reducers/location-index';
import i18n from '-/services/i18n';
import { getMaxSearchResults } from '-/reducers/settings';
import { getSelectedEntries } from '-/reducers/app';
import { TS } from '-/tagspaces.namespace';
import TaggingActions from '-/reducers/tagging-actions';

const isTagLibraryReadOnly =
  window.ExtTagLibrary && window.ExtTagLibrary.length > 0;

interface Props {
  anchorEl?: Element;
  open?: boolean;
  onClose: () => void;
  selectedTag?: TS.Tag;
  setSearchQuery: (searchQuery: TS.SearchQuery) => void;
  showEditTagDialog: () => void;
  showDeleteTagDialog: () => void;
  maxSearchResults: number;
  selectedEntries: Array<any>;
  isReadOnlyMode: boolean;
  addTags: (
    paths: Array<string>,
    tags: Array<TS.Tag>,
    updateIndex?: boolean
  ) => void;
}

function TagMenu(props: Props) {
  const {
    isReadOnlyMode,
    selectedTag,
    setSearchQuery,
    onClose,
    showEditTagDialog,
    showDeleteTagDialog,
    maxSearchResults,
    selectedEntries,
    addTags,
    anchorEl,
    open
  } = props;

  function showFilesWithThisTag() {
    if (selectedTag) {
      setSearchQuery({
        tagsAND: [selectedTag],
        maxSearchResults
      });
    }
    onClose();
  }

  function showEditTagMenuDialog() {
    onClose();
    showEditTagDialog();
  }

  function openDeleteTagDialog() {
    onClose();
    showDeleteTagDialog();
  }

  function applyTag() {
    const selectedEntryPaths = selectedEntries.map(entry => entry.path);
    addTags(selectedEntryPaths, [selectedTag]);
    onClose();
  }

  return (
    <div style={{ overflowY: 'hidden' }}>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        <MenuItem
          data-tid="showFilesWithThisTag"
          onClick={showFilesWithThisTag}
        >
          <ListItemIcon>
            <ShowEntriesWithTagIcon />
          </ListItemIcon>
          <ListItemText primary={i18n.t('core:showFilesWithThisTag')} />
        </MenuItem>
        {selectedEntries && selectedEntries.length > 0 && !isReadOnlyMode && (
          <MenuItem data-tid="applyTagTID" onClick={applyTag}>
            <ListItemIcon>
              <ApplyTagIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:applyTag')} />
          </MenuItem>
        )}
        {!isTagLibraryReadOnly && (
          <MenuItem data-tid="editTagDialog" onClick={showEditTagMenuDialog}>
            <ListItemIcon>
              <Edit />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:editTag')} />
          </MenuItem>
        )}
        {!isTagLibraryReadOnly && (
          <MenuItem data-tid="deleteTagDialog" onClick={openDeleteTagDialog}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:deleteTagFromTagGroup')} />
          </MenuItem>
        )}
      </Menu>
    </div>
  );
}

function mapStateToProps(state) {
  return {
    maxSearchResults: getMaxSearchResults(state),
    selectedEntries: getSelectedEntries(state)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setSearchQuery: LocationIndexActions.setSearchQuery,
      addTags: TaggingActions.addTags
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(TagMenu);
