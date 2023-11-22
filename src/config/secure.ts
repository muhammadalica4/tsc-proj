import { prefix, regexPrefix } from './config';
export interface SecureRoute {
  url: string,
  method: string,
  requestPermissions: boolean,
  requestAuthentication: boolean,
  regex: any
};

export interface SecureRoutes {
  [key: string]: SecureRoute
};

export const secure: SecureRoutes = {
  'getDashboardDataForAdmin': {
    url: `${prefix}/dashboard`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/dashboard`
  },
  'getDashboardDataForCurrentUser': {
    url: `${prefix}/mydashboard`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/mydashboard`
  },
  'getDashboardDataForUser': {
    url: `${prefix}/dashboard/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/dashboard\/:userId`
  },
  'validateSession': {
    url: `${prefix}/validateSession`,
    method: 'HEAD',
    requestPermissions: false,
    requestAuthentication: true,
    regex: `${regexPrefix}\/validateSession`
  },
  'webLogin': {
    url: `${prefix}/web/login`,
    method: 'POST',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/web\/login`
  },
  'tabletLogin': {
    url: `${prefix}/tablet/login`,
    method: 'POST',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/tablet\/login`
  },
  'companianLogin': {
    url: `${prefix}/companian/login`,
    method: 'POST',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/companian\/login`
  },
  'logout': {
    url: `${prefix}/logout`,
    method: 'POST',
    requestPermissions: false,
    requestAuthentication: true,
    regex: `${regexPrefix}\/logout`
  },
  'getMyProfile': {
    url: `${prefix}/v1/me`,
    method: 'GET',
    requestPermissions: false,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/me`
  },
  'getMyFeatures': {
    url: `${prefix}/v1/myFeatures`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myFeatures`
  },
  'saveFirebase': {
    url: `${prefix}/v1/saveFirebase`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/saveFirebase`
  },
  'getUserFeatures': {
    url: `${prefix}/v1/userfeatures/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userfeatures\/:userId`
  },
  'updateMyFeatures': {
    url: `${prefix}/v1/myFeatures`,
    method: 'PATCH',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myFeatures`
  },
  'updateUserFeatures': {
    url: `${prefix}/v1/userfeatures/update`,
    method: 'PATCH',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userfeatures\/update`
  },
  'getUsers': {
    url: `${prefix}/v1/users`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/users`
  },
  'getUserById': {
    url: `${prefix}/v1/user/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/user\/:userId`
  },
  'addUser': {
    url: `${prefix}/v1/user/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/user\/add`
  },
  'editUser': {
    url: `${prefix}/v1/user/:userId`,
    method: 'PUT',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/user\/:userId`
  },
  'deleteUser': {
    url: `${prefix}/v1/user/:userId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/user\/:userId`
  },
  'undeleteUser': {
    url: `${prefix}/v1/user/:userId`,
    method: 'PATCH',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/user\/:userId`
  },
  'getCompanians': {
    url: `${prefix}/v1/companians`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companians`
  },
  'getMyCompanians': {
    url: `${prefix}/v1/myCompanians`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myCompanians`
  },
  'getMyPlaylists': {
    url: `${prefix}/v1/myPlaylists`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myPlaylists`
  },
  'getMyQuestions': {
    url: `${prefix}/v1/myQuestions`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myQuestions`
  },
  'getMyPermissions': {
    url: `${prefix}/v1/myPermissions`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myPermissions`
  },
  'getMyAccess': {
    url: `${prefix}/v1/myAccess`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myAccess`
  },
  'getMyConversations': {
    url: `${prefix}/v1/myConversations`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myConversations`
  },
  'getMyAnswers': {
    url: `${prefix}/v1/myAnswers`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myAnswers`
  },
  'getMyAllLinkedAccounts': {
    url: `${prefix}/v1/userAccounts`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userAccounts`
  },
  'getUserCompanians': {
    url: `${prefix}/v1/usercompanians/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/usercompanians\/:userId`
  },
 
  'getUserPlaylists': {
    url: `${prefix}/v1/userplaylists/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userplaylists\/:userId`
  },
  'getUserQuestions': {
    url: `${prefix}/v1/userquestions/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userquestions\/:userId`
  },
  'getUserPermissions': {
    url: `${prefix}/v1/userpermissions/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userpermissions\/:userId`
  },
  'getUserAccess': {
    url: `${prefix}/v1/useraccess/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/useraccess\/:userId`
  },
  'getUserConversations': {
    url: `${prefix}/v1/userconversation/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userconversation\/:userId`
  },
  'getUserAnswers': {
    url: `${prefix}/v1/useranswers/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/useranswers\/:userId`
  },
  'getUserAllLinkedAccounts': {
    url: `${prefix}/v1/useraccounts/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/useraccounts/:userId`
  },
  'getCompanianById': {
    url: `${prefix}/v1/companian/:companianId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companian\/:companianId`
  },
  'getMyUsers': {
    url: `${prefix}/v1/myUsers`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myUsers`
  },
  'getCompanianUsers': {
    url: `${prefix}/v1/companianusers/:companianId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companianusers\/:companianId`
  },
  'addCompanian': {
    url: `${prefix}/v1/companian/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companian\/add`
  },
  'addMyCompanian': {
    url: `${prefix}/v1/companian/addMyCompanian`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companian\/addMyCompanian`
  },
  'addUserCompanian': {
    url: `${prefix}/v1/usercompanian/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/usercompanian\/add`
  },
  'editCompanian': {
    url: `${prefix}/v1/companian/:companianId`,
    method: 'PUT',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companian\/:companianId`
  },
  'assignCompanian': {
    url: `${prefix}/v1/companian/assign`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companian\/assign`
  },
  'grantAccess': {
    url: `${prefix}/v1/access/grant`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/access\/grant`
  },
  'unlinkCompanian': {
    url: `${prefix}/v1/companian/unlink`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companian\/unlink`
  },
  'denyAccess': {
    url: `${prefix}/v1/access/deny`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/access\/deny`
  },
  'deleteCompanian': {
    url: `${prefix}/v1/companian/:companianId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/companian\/:companianId`
  },
  'getPermissions': {
    url: `${prefix}/v1/permissions`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/permissions`
  },
  'getPermissionById': {
    url: `${prefix}/v1/permission/:permissionId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/permission\/:permissionId`
  },
  'addPermission': {
    url: `${prefix}/v1/permission/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/permission\/add`
  },
  'editPermission': {
    url: `${prefix}/v1/permission/:permissionId`,
    method: 'PUT',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/permission\/:permissionId`
  },
  'grantPermissions': {
    url: `${prefix}/v1/permission/grant`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/permission\/grant`
  },
  'deletePermission': {
    url: `${prefix}/v1/permission/:permissionId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/permission\/:permissionId`
  },
  'getMedias': {
    url: `${prefix}/v1/medias`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/medias`
  },
  'getMediaById': {
    url: `${prefix}/v1/media/:mediaId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/media\/:mediaId`
  },
  'addMedia': {
    url: `${prefix}/v1/media/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/media\/add`
  },
  'addMediaToPlaylist': {
    url: `${prefix}/v1/addMediaToPlaylist`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/addMediaToPlaylist`
  },
  'assignMedia': {
    url: `${prefix}/v1/media/assign`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/media\/assign`
  },
  'deleteMedia': {
    url: `${prefix}/v1/media/:mediaId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/media\/:mediaId`
  },
  'getPlaylists': {
    url: `${prefix}/v1/playlists`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/playlists`
  },
  'getPlaylistById': {
    url: `${prefix}/v1/playlist/:playlistId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/playlist\/:playlistId`
  },
  'getPlaylistItems': {
    url: `${prefix}/v1/playlist/:playlistId/items`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/playlist\/:playlistId/items`
  },
  'addPlaylist': {
    url: `${prefix}/v1/playlist/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/playlist\/add`
  },
  'editPlaylist': {
    url: `${prefix}/v1/playlist/:playlistId`,
    method: 'PUT',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/playlist\/:playlistId`
  },
  'addMyPlaylist': {
    url: `${prefix}/v1/addMyPlaylist`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/addMyPlaylist`
  },
  'addUserPlaylist': {
    url: `${prefix}/v1/userplaylist/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userplaylist/add`
  },
  'assignPlaylist': {
    url: `${prefix}/v1/playlist/assign`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/playlist\/assign`
  },
  'deletePlaylist': {
    url: `${prefix}/v1/playlist/:playlistId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/playlist\/:playlistId`
  },
  'getSessions': {
    url: `${prefix}/v1/sessions`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/sessions`
  },
  'getSessionById': {
    url: `${prefix}/v1/session/:sessionId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/session\/:sessionId`
  },
  'getQuestions': {
    url: `${prefix}/v1/questions`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/questions`
  },
  'getMyRandomQuestion': {
    url: `${prefix}/v1/randomQuestion`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/randomQuestion`
  },
  'getQuestionById': {
    url: `${prefix}/v1/question/:questionId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/question\/:questionId`
  },
  'addQuestion': {
    url: `${prefix}/v1/question/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/question\/add`
  },
  'assignQuestion': {
    url: `${prefix}/v1/question/assign`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/question\/assign`
  },
  'addMyQuestion': {
    url: `${prefix}/v1/addMyQuestion`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/addMyQuestion`
  },
  'addUserQuestion': {
    url: `${prefix}/v1/userquestion/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userquestion\/add`
  },
  'editQuestion': {
    url: `${prefix}/v1/question/:questionId`,
    method: 'PUT',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/question\/:questionId`
  },
  'deleteQuestion': {
    url: `${prefix}/v1/question/:questionId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/question\/:questionId`
  },
  'getAnswers': {
    url: `${prefix}/v1/answers`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/answers`
  },
  'getAnswerById': {
    url: `${prefix}/v1/answer/:answerId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/answer\/:answerId`
  },
  'answerRandomQuestion': {
    url: `${prefix}/v1/randomAnswer`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/randomAnswer`
  },
  'addAnswer': {
    url: `${prefix}/v1/answer/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/answer\/add`
  },
  'editAnswer': {
    url: `${prefix}/v1/answer/:answerId`,
    method: 'PUT',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/answer\/:answerId`
  },
  'deleteAnswer': {
    url: `${prefix}/v1/answer/:answerId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/answer\/:answerId`
  },
  'getNotifications': {
    url: `${prefix}/v1/notifications`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/notifications`
  },
  'getNotificationById': {
    url: `${prefix}/v1/notification/:notificationId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/notification\/:notificationId`
  },
  'getMyNotifications': {
    url: `${prefix}/v1/myNotifications`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/myNotifications`,
  },
  'getUserNotifications': {
    url: `${prefix}/v1/usernotifications/:userId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/usernotifications\/:userId`,
  },
  'seeNotification': {
    url: `${prefix}/v1/seenotification/:notificationId`,
    method: 'PATCH',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/seenotification\/:notificationId`,
  },
  'deleteNotification': {
    url: `${prefix}/v1/notification/:notificationId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/notification\/:notificationId`
  },
  'getConversations': {
    url: `${prefix}/v1/conversations`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/conversations`
  },
  'getConversationById': {
    url: `${prefix}/v1/conversation/:conversationId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/conversations\/:conversationId`
  },
  'addConversation': {
    url: `${prefix}/v1/conversation/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/conversation\/add`
  },
  'addUserConversation': {
    url: `${prefix}/v1/userconversation/add`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userconversation\/add`
  },
  'addUsersToMyConversation': {
    url: `${prefix}/v1/conversation/addusers`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/conversation\/addusers`
  },
  'addUsersToUserConversation': {
    url: `${prefix}/v1/userconversation/:userId`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/userconversation\/:userId`
  },
  'deleteConversation': {
    url: `${prefix}/v1/conversation/:conversationId`,
    method: 'DELETE',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/conversations\/:conversationId`
  },
  'getMessages': {
    url: `${prefix}/v1/messages`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/messages`
  },
  'getMessageById': {
    url: `${prefix}/v1/message/:messageId`,
    method: 'GET',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/message\/:messageId`
  },
  'sendMessage': {
    url: `${prefix}/v1/message/send`,
    method: 'POST',
    requestPermissions: true,
    requestAuthentication: true,
    regex: `${regexPrefix}\/v1\/message\/send`
  },
  'createAgenda': {
    url: `${prefix}/createAgenda`,
    method: 'POST',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/createAgenda`
  },
  'updateAgenda': {
    url: `${prefix}/updateAgenda/:agendaId`,
    method: 'PUT',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/updateAgenda\/:agendaId`
  },
  'deleteAgenda': {
    url: `${prefix}/deleteAgenda/:agendaId`,
    method: 'DELETE',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/deleteAgenda\/:agendaId`
  },

  'getUserAgendaList': {
    url: `${prefix}/getUserAgendaList/:agendaId`,
    method: 'GET',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/getUserAgendaList\/:agendaId`
  },
   'getAgenda': {
    url: `${prefix}/v1/agendas`,
    method: 'GET',
    requestPermissions: false,
    requestAuthentication: false,
    regex: `${regexPrefix}\/v1\/agendas`
  },
};
