import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import * as userSelectors from "../store/users/reducer";
import Icon from "./Icon";
import { ReviewPlus } from "../protocols/agent/agent.protocol.reviews";
import Tag from "./Tag";
import Timestamp from "./Timestamp";
import Tooltip from "./Tooltip";
import { CodeStreamState } from "../store";
import { markdownify } from "./Markdowner";
import { setCurrentReview, setCurrentCodemark } from "../store/context/actions";
import { HeadshotName } from "../src/components/HeadshotName";
import { CodemarkPlus } from "@codestream/protocols/agent";
import { isCSReview } from "../protocols/agent/api.protocol.models";

const RootTR = styled.tr`
	margin: 0;
	&.archived td {
		opacity: 0.5;
	}
	.title {
		cursor: pointer;
		font-size: larger;
	}
	.details {
		opacity: 0.5;
	}
	p {
		display: inline;
		margin: 0;
	}
	:hover {
		background: var(--app-background-color-hover);
	}
	td:nth-child(1) {
		vertical-align: top;
		padding: 8px 5px 5px 20px;
		width: 20px;
		.icon {
			display: inline-block;
			transform: scale(1.25);
		}
	}
	td:nth-child(2) {
		vertical-align: top;
		padding: 5px;
	}
	td:nth-child(3) {
		text-align: left;
		padding: 5px 0 0 0;
	}
	td:nth-child(4) {
		white-space: nowrap;
		text-align: center;
		padding: 5px 10px 5px 5px;
	}
	td {
		@media only screen and (max-width: 430px) {
			font-size: 12px;
		}
		@media only screen and (max-width: 350px) {
			font-size: 11px;
		}
		@media only screen and (max-width: 270px) {
			font-size: 10px;
		}
	}
`;

const Title = styled.div`
	p {
		display: inline;
		margin: 0;
	}
	.title {
		font-size: larger;
	}
	.details {
		opacity: 0.5;
	}
`;

interface Props {
	result: ReviewPlus | CodemarkPlus;
	titleOnly?: boolean;
	query?: string;
	onClick?: Function;
}

export default function SearchResult(props: Props) {
	const { result } = props;
	const dispatch = useDispatch();
	const derivedState = useSelector((state: CodeStreamState) => {
		return {
			teamTagsHash: userSelectors.getTeamTagsHash(state),
			usernames: userSelectors.getUsernamesById(state)
		};
	});

	const selectResult = () => {
		if (isCSReview(result)) dispatch(setCurrentReview(result.id));
		else dispatch(setCurrentCodemark(result.id));
	};

	const type = isCSReview(result) ? "review" : result.type;

	let titleHTML = markdownify(type === "comment" ? result.text.substr(0, 80) : result.title);
	if (props.query) {
		const matchQueryRegexp = new RegExp(props.query, "gi");
		titleHTML = titleHTML.replace(matchQueryRegexp, "<u><b>$&</b></u>");
	}

	const assignees = (isCSReview(result) ? result.reviewers : result.assignees) || [];

	let icon;
	let createdVerb = "opened";
	switch (type) {
		case "review":
			icon = "code";
			break;
		case "issue":
			icon = "issue";
			break;
		default:
			icon = "comment";
			createdVerb = "posted";
			break;
	}

	const titleTip = result.text;

	// @ts-ignore
	const isArchived = isCSReview(result) ? false : result.pinned ? false : true;

	const title = (
		<Title>
			<div className="title">
				<Tooltip title={titleTip} placement="top" delay={1}>
					<span dangerouslySetInnerHTML={{ __html: titleHTML }} />
				</Tooltip>
				&nbsp;
				{(result.tags || []).map(tagId => {
					const tag = derivedState.teamTagsHash[tagId];
					return tag ? <Tag tag={tag} /> : null;
				})}
			</div>

			<div className="details">
				#12 {createdVerb} <Timestamp relative time={result.createdAt} /> by{" "}
				{derivedState.usernames[result.creatorId]} {result.status && <>&middot; {result.status} </>}
				{isArchived && <>&middot; archived </>}
			</div>
		</Title>
	);

	if (props.titleOnly) return title;

	return (
		<RootTR onClick={selectResult} className={isArchived ? "archived" : ""}>
			<td>
				<Icon name={icon} />
			</td>
			<td>{title}</td>
			<td>
				{assignees.map(id => (
					<HeadshotName id={id} />
				))}
			</td>
			<td>
				{result.numReplies > 0 && (
					<>
						<Icon name="comment" /> {result.numReplies}
					</>
				)}
			</td>
		</RootTR>
	);
}
