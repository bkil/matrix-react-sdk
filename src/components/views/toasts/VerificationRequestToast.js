/*
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import PropTypes from 'prop-types';
import sdk from "../../../index";
import { _t } from '../../../languageHandler';
import Modal from "../../../Modal";
import MatrixClientPeg from '../../../MatrixClientPeg';

function getUser(verifier) {
    const client = MatrixClientPeg.get();
    let user;
    if (verifier.roomId) {
        const room = client.getRoom(verifier.roomId);
        user = room && room.getMember(verifier.userId);
    }
    if (!user) {
        user = client.getUser(verifier.userId);
    }
    return user;
}

export default class VerificationRequestToast extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {counter: 30, user: getUser(props.verifier)};
    }

    componentDidMount() {
        this._intervalHandle = setInterval(() => {
            let {counter} = this.state;
            counter -= 1;
            if (counter <= 0) {
                this.cancel();
            } else {
                this.setState({counter});
            }
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this._intervalHandle);
    }

    cancel = () => {
        this.props.dismiss();
        try {
            this.props.verifier.cancel("User declined");
        } catch (err) {
            console.error("Error while cancelling verification request", err);
        }
    }

    accept = () => {
        this.props.dismiss();
        const IncomingSasDialog = sdk.getComponent('views.dialogs.IncomingSasDialog');
        Modal.createTrackedDialog('Incoming Verification', '', IncomingSasDialog, {
            verifier: this.props.verifier,
        });
    };

    render() {
        const FormButton = sdk.getComponent("elements.FormButton");
        const {userId} = this.props.verifier;
        let name;
        if (this.state.user) {
            const {displayName} = this.state.user;
            name = `${displayName} (${userId})`;
        } else {
            name = userId;
        }
        return (<div>
            <div className="mx_Toast_description">{name}</div>
            <div className="mx_Toast_buttons">
                <FormButton label={_t("Decline (%(counter)s)", {counter: this.state.counter})} kind="danger" onClick={this.cancel} />
                <FormButton label={_t("Accept")} onClick={this.accept} />
            </div>
        </div>);
    }
}

VerificationRequestToast.propTypes = {
    dismiss: PropTypes.func.isRequired,
    verifier: PropTypes.object.isRequired,
};
