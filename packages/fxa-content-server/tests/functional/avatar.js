/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const path = require('path');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');

const config = intern._config;

const PASSWORD = 'passwordzxcv';
const SETTINGS_URL = config.fxaContentRoot + 'settings';
const ENTER_EMAIL_URL = config.fxaContentRoot + '?action=email';
const UPLOAD_IMAGE_PATH = path.join(
  process.cwd(),
  'app',
  'apple-touch-icon-152x152.png'
);

let email;

const {
  clearBrowserState,
  click,
  createEmail,
  createUser,
  fillOutEmailFirstSignIn,
  getWebChannelMessageData,
  openPage,
  storeWebChannelMessageData,
  testElementExists,
} = FunctionalHelpers;

registerSuite('settings/avatar', {
  beforeEach: function () {
    email = createEmail();

    return this.remote
      .then(createUser(email, PASSWORD, { preVerified: true }))
      .then(clearBrowserState({ force: true }))

      .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
      .then(fillOutEmailFirstSignIn(email, PASSWORD))
      .then(testElementExists(selectors.SETTINGS.HEADER));
  },

  tests: {
    'go to settings then avatar change': function () {
      return (
        this.remote
          .then(openPage(SETTINGS_URL, selectors.SETTINGS.HEADER))

          // go to add avatar
          .then(click(selectors.SETTINGS_AVATAR.MENU_BUTTON))

          // success is going to the change avatar page
          .then(testElementExists(selectors.SETTINGS_AVATAR.BUTTON_ADD_PHOTO))
      );
    },

    'attempt to use webcam for avatar': function () {
      return (
        this.remote
          .then(openPage(SETTINGS_URL, selectors.SETTINGS.HEADER))
          // go to change avatar
          .then(click(selectors.SETTINGS_AVATAR.MENU_BUTTON))
          .then(storeWebChannelMessageData('profile:change'))
          // click button, look for the loading spinner
          .then(click(selectors.SETTINGS_AVATAR.BUTTON_CAMERA))
          // then wait for the loading spinner to become invisible again
          .sleep(1000)
          .then(click(selectors.SETTINGS_AVATAR.BUTTON_CAPTURING))
          .then(click(selectors.SETTINGS_AVATAR.SUBMIT))
          .then(testElementExists(selectors.SETTINGS.HEADER))
          //success is seeing the image loaded
          .then(testElementExists(selectors.SETTINGS_AVATAR.NON_DEFAULT_IMAGE))
          // Replacement for testIsBrowserNotified
          .then(getWebChannelMessageData('profile:change'))
          .then((msg) => {
            assert.equal(msg.command, 'profile:change');
          })
      );
    },

    'attempt to use webcam for avatar, then cancel': function () {
      return (
        this.remote
          .then(openPage(SETTINGS_URL, selectors.SETTINGS.HEADER))

          // go to change avatar
          .then(click(selectors.SETTINGS_AVATAR.MENU_BUTTON))
          .then(click(selectors.SETTINGS_AVATAR.BUTTON_CAMERA))
          .sleep(1000)
          // look for the button shown when the webcam capture has begun
          .then(testElementExists(selectors.SETTINGS_AVATAR.BUTTON_CAPTURING))
          .then(click(selectors.SETTINGS_AVATAR.BACK))

          // success is returning to the settings page
          .then(testElementExists(selectors.SETTINGS.HEADER))
      );
    },

    'upload a profile image': function () {
      return (
        this.remote
          .then(openPage(SETTINGS_URL, selectors.SETTINGS.HEADER))
          .then(click(selectors.SETTINGS_AVATAR.MENU_BUTTON))
          .then(storeWebChannelMessageData('profile:change'))

          // Selenium's way of interacting with a file picker
          .findByCssSelector(selectors.SETTINGS_AVATAR.UPLOAD_FILENAME_INPUT)
          .type(UPLOAD_IMAGE_PATH)
          .end()

          .then(testElementExists(selectors.SETTINGS_AVATAR.BUTTON_ROTATE))

          .then(click(selectors.SETTINGS_AVATAR.BUTTON_ZOOM_OUT))
          .then(click(selectors.SETTINGS_AVATAR.BUTTON_ZOOM_IN))
          .then(click(selectors.SETTINGS_AVATAR.BUTTON_ROTATE))
          .then(click(selectors.SETTINGS_AVATAR.SUBMIT))

          //success is seeing the image loaded
          .then(testElementExists(selectors.SETTINGS_AVATAR.NON_DEFAULT_IMAGE))
          // Replacement for testIsBrowserNotified
          .then(getWebChannelMessageData('profile:change'))
          .then((msg) => {
            assert.equal(msg.command, 'profile:change');
          })
      );
    },

    'cancel uploading a profile image': function () {
      return (
        this.remote
          .then(openPage(SETTINGS_URL, selectors.SETTINGS.HEADER))
          .then(click(selectors.SETTINGS_AVATAR.MENU_BUTTON))

          // Selenium's way of interacting with a file picker
          .findByCssSelector(selectors.SETTINGS_AVATAR.UPLOAD_FILENAME_INPUT)
          .type(UPLOAD_IMAGE_PATH)
          .end()

          .then(testElementExists(selectors.SETTINGS_AVATAR.BUTTON_ROTATE))

          .then(click(selectors.SETTINGS_AVATAR.BACK))

          // success is returning to the settings page
          .then(testElementExists(selectors.SETTINGS.HEADER))
      );
    },
  },
});
