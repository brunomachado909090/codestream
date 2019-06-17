import React from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import Button from "../Stream/Button";
import { authenticate } from "./actions";
import { CodeStreamState } from "../store";
import { goToNewUserEntry, goToForgotPassword } from "../store/context/actions";
import { startSSOSignin } from "../store/actions";

const isPasswordInvalid = password => password.length === 0;
const isEmailInvalid = email => {
	const emailRegex = new RegExp(
		"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
	);
	return email === "" || emailRegex.test(email) === false;
};

interface ConnectedProps {
	initialEmail?: string;
}

interface DispatchProps {
	authenticate: (
		...args: Parameters<typeof authenticate>
	) => ReturnType<ReturnType<typeof authenticate>>;
	goToNewUserEntry: typeof goToNewUserEntry;
	startSSOSignin: (
		...args: Parameters<typeof startSSOSignin>
	) => ReturnType<ReturnType<typeof startSSOSignin>>;
	goToForgotPassword: typeof goToForgotPassword;
}

interface Props extends ConnectedProps, DispatchProps {}

interface State {
	email: string;
	password: string;
	passwordTouched: boolean;
	emailTouched: boolean;
	loading: boolean;
	error: string | undefined;
}

class Login extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			email: props.initialEmail || "",
			password: "",
			passwordTouched: false,
			emailTouched: false,
			loading: false,
			error: undefined
		};
	}

	onBlurPassword = () => this.setState({ passwordTouched: true });

	onBlurEmail = () => this.setState({ emailTouched: true });

	renderEmailError = () => {
		const { email, emailTouched } = this.state;
		if (isEmailInvalid(email) && emailTouched)
			return (
				<small className="error-message">
					<FormattedMessage id="login.email.invalid" />
				</small>
			);
		return;
	};

	renderPasswordHelp = () => {
		const { password, passwordTouched } = this.state;
		if (isPasswordInvalid(password) && passwordTouched) {
			return (
				<small className="error-message">
					<FormattedMessage id="login.password.required" />
				</small>
			);
		}
		return;
	};

	// renderAccountMessage = () => {
	// 	if (this.props.alreadySignedUp)
	// 		return (
	// 			<p>
	// 				<FormattedMessage id="login.alreadySignedUp" />
	// 			</p>
	// 		);
	// 	if (this.props.alreadyConfirmed)
	// 		return (
	// 			<p>
	// 				<FormattedMessage id="login.alreadyConfirmed" />
	// 			</p>
	// 		);
	// 	return;
	// };

	renderError = () => {
		if (this.state.error === "INVALID_CREDENTIALS")
			return (
				<div className="error-message form-error">
					<FormattedMessage id="login.invalid" />
				</div>
			);
		if (this.state.error === "UNKNOWN")
			return (
				<div className="error-message form-error">
					<FormattedMessage
						id="error.unexpected"
						defaultMessage="Something went wrong! Please try again, or "
					/>
					<a href="https://help.codestream.com">
						<FormattedMessage id="contactSupport" defaultMessage="contact support" />
					</a>
					.
				</div>
			);
		if (this.state.error) {
			return (
				<div className="error-message form-error">
					<FormattedMessage id="something-is-screwed" defaultMessage={this.state.error} />{" "}
					<a href="https://help.codestream.com">
						<FormattedMessage id="contactSupport" defaultMessage="contact support" />
					</a>
					.
				</div>
			);
		}
		return;
	};

	isFormInvalid = () => {
		const { password, email } = this.state;
		return isPasswordInvalid(password) || isEmailInvalid(email);
	};

	submitCredentials = async event => {
		event.preventDefault();
		if (this.isFormInvalid()) {
			if (!(this.state.passwordTouched && this.state.emailTouched))
				this.setState({ emailTouched: true, passwordTouched: true });
			return;
		}
		const { password, email } = this.state;
		this.setState({ loading: true });
		try {
			await this.props.authenticate({ password, email });
		} catch (error) {
			this.setState({ loading: false });
			this.setState({ error });
		}
	};

	handleClickSignup = event => {
		event.preventDefault();
		this.props.goToNewUserEntry();
	};

	handleClickSlackSignup = event => {
		event.preventDefault();
		this.props.startSSOSignin("slack");
	};

	handleClickMSTeamsSignup = event => {
		event.preventDefault();
		this.props.startSSOSignin("msteams");
	};

	onClickForgotPassword = (event: React.SyntheticEvent) => {
		event.preventDefault();
		this.props.goToForgotPassword({ email: this.state.email });
	};

	render() {
		return (
			<div id="login-page" className="onboarding-page">
				<h2>Sign In to CodeStream</h2>
				<div className="divider" />
				<form className="standard-form">
					<fieldset className="form-body">
						<div id="controls">
							<div className="button-group">
								<Button
									className="control-button"
									type="button"
									onClick={this.handleClickSlackSignup}
								>
									Sign In with Slack
								</Button>
							</div>
							<div className="button-group">
								<Button
									className="control-button"
									type="button"
									onClick={this.handleClickMSTeamsSignup}
								>
									Sign In with Microsoft Teams
								</Button>
							</div>
						</div>
					</fieldset>
				</form>
				<div className="divider" />
				<form className="standard-form" onSubmit={this.submitCredentials}>
					<fieldset className="form-body">
						{/* this.renderAccountMessage() */}
						<div id="controls">
							<div className="spacer" />
							{this.renderError()}
							<div id="email-controls" className="control-group">
								<label>
									<FormattedMessage id="login.email.label" />
								</label>
								<input
									id="login-input-email"
									className="native-key-bindings input-text control"
									type="text"
									name="email"
									value={this.state.email}
									onChange={e => this.setState({ email: e.target.value })}
									onBlur={this.onBlurEmail}
									required={this.state.emailTouched}
								/>
								{this.renderEmailError()}
							</div>
							<div id="password-controls" className="control-group">
								<label>
									<FormattedMessage id="login.password.label" />
								</label>
								<input
									id="login-input-password"
									className="native-key-bindings input-text"
									type="password"
									name="password"
									value={this.state.password}
									onChange={e => this.setState({ password: e.target.value })}
									onBlur={this.onBlurPassword}
									required={this.state.passwordTouched}
								/>
								{this.renderPasswordHelp()}
								{/* <div className="help-link">
									<a onClick={this.onClickForgotPassword}>
										<FormattedMessage id="login.forgotPassword" />
									</a>
								</div>*/}
							</div>
							<div className="button-group">
								<Button
									id="login-button"
									className="control-button"
									type="submit"
									loading={this.state.loading}
								>
									<FormattedMessage id="login.submitButton" />
								</Button>
							</div>
							<div className="footer">
								<p>
									Don't have an account? <a onClick={this.handleClickSignup}>Sign Up</a>
								</p>
							</div>
						</div>
					</fieldset>
				</form>
			</div>
		);
	}
}

const ConnectedLogin = connect<ConnectedProps, any, any, CodeStreamState>(
	(state, props) => ({
		initialEmail: props.email !== undefined ? props.email : state.configs.email
	}),
	{ authenticate, goToNewUserEntry, startSSOSignin, goToForgotPassword }
)(Login);

export { ConnectedLogin as Login };
