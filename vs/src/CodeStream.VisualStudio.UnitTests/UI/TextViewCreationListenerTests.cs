﻿using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Reactive.Subjects;
using CodeStream.VisualStudio.Events;
using CodeStream.VisualStudio.Services;
using CodeStream.VisualStudio.UI;
using CodeStream.VisualStudio.UI.Margins;
using CodeStream.VisualStudio.UnitTests.Stubs;
using Microsoft.VisualStudio.Editor;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.VisualStudio.Text;
using Microsoft.VisualStudio.Text.Editor;
using Microsoft.VisualStudio.TextManager.Interop;
using Microsoft.VisualStudio.Utilities;
using Moq;

namespace CodeStream.VisualStudio.UnitTests.UI {
	[TestClass]
	public class TextViewCreationListenerTests {
		[TestMethod]
		public void TextViewCreationListenerTest() {

			var textView = new Mock<IVsTextView>();
			var wpfTextViewMock = new Mock<IWpfTextView>();
			wpfTextViewMock.Setup(_ => _.Roles).Returns(new TextViewRoleSet(TextViewRoles.DefaultRoles));

			var codeStreamMarginProviderMock = new Mock<ICodeStreamMarginProvider>();
			codeStreamMarginProviderMock.Setup(_ => _.TextViewMargin).Returns(new Mock<ICodeStreamWpfTextViewMargin>().Object);
			var textViewMarginProviders = new List<IWpfTextViewMarginProvider> {
				codeStreamMarginProviderMock.Object
			};

			var pc = new PropertyCollection();
			wpfTextViewMock.Setup(_ => _.Properties).Returns(pc);
			wpfTextViewMock.Setup(_ => _.Caret).Returns(new Mock<ITextCaret>().Object);

			var textDocumentFactoryServiceMock = new Mock<ITextDocumentFactoryService>();
			var textDocument = new Mock<ITextDocument>();
			textDocument.Setup(_ => _.FilePath).Returns(@"C:\cheese.cs");
			var td = textDocument.Object;
			textDocumentFactoryServiceMock.Setup(_ => _.TryGetTextDocument(It.IsAny<ITextBuffer>(), out td)).Returns(true);

			var editorAdaptersFactoryServiceMock = new Mock<IVsEditorAdaptersFactoryService>();
			editorAdaptersFactoryServiceMock.Setup(_ => _.GetWpfTextView(textView.Object))
				.Returns(wpfTextViewMock.Object);

			var bufferCollection = new Collection<ITextBuffer>(new List<ITextBuffer> { new Mock<ITextBuffer>().Object });
			var reason = ConnectionReason.TextViewLifetime;
			var textViewCache = new WpfTextViewCache();
			var eventAggregator = new Mock<IEventAggregator>();
			eventAggregator.Setup(_ => _.GetEvent<DocumentMarkerChangedEvent>()).Returns(new Subject<DocumentMarkerChangedEvent>());
			eventAggregator.Setup(_ => _.GetEvent<SessionReadyEvent>()).Returns(new Subject<SessionReadyEvent>());
			eventAggregator.Setup(_ => _.GetEvent<SessionLogoutEvent>()).Returns(new Subject<SessionLogoutEvent>());
			eventAggregator.Setup(_ => _.GetEvent<MarkerGlyphVisibilityEvent>()).Returns(new Subject<MarkerGlyphVisibilityEvent>());

			var listener = new TextViewCreationListener(
			   eventAggregator.Object,
			   new Mock<ISessionService>().Object,
			   new Mock<ICodeStreamAgentService>().Object,
			   new Mock<IIdeService>().Object,
			   textViewCache,
			   new Mock<ICodeStreamService>().Object
		   ) {
				EditorAdaptersFactoryService = editorAdaptersFactoryServiceMock.Object,
				TextDocumentFactoryService = textDocumentFactoryServiceMock.Object,
				TextViewMarginProviders = textViewMarginProviders
			};

			((IWpfTextViewConnectionListener)listener).SubjectBuffersConnected(wpfTextViewMock.Object, reason, bufferCollection);
			var propertyCount = wpfTextViewMock.Object.Properties.PropertyList.Count;
			Assert.AreEqual(1, textViewCache.Count());
			Assert.AreEqual(true, propertyCount > 0);
			
			listener.VsTextViewCreated(textView.Object);
			listener.OnSessionReady(wpfTextViewMock.Object);
			Assert.AreEqual(true, wpfTextViewMock.Object.Properties.PropertyList.Count > propertyCount);

			((IWpfTextViewConnectionListener)listener).SubjectBuffersDisconnected(wpfTextViewMock.Object, reason, bufferCollection);
			Assert.AreEqual(0, textViewCache.Count());
			Assert.AreEqual(true, wpfTextViewMock.Object.Properties.PropertyList.Count == 0);
		}
	}
}
