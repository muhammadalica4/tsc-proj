import { Router } from 'express';
import multipart from '../middlewares/multipart';
import { secure } from '../config';
import Controller from '../controllers';

const router = Router();
// dashboard
router.get(secure.getDashboardDataForAdmin.url, Controller.getDashboardDataForAdmin);
router.get(secure.getDashboardDataForCurrentUser.url, Controller.getDashboardDataForCurrentUser);
router.get(secure.getDashboardDataForUser.url, Controller.getDashboardDataForUser);
// auth
router.post(secure.webLogin.url, Controller.webLogin);
router.post(secure.tabletLogin.url, Controller.tabletLogin);
router.post(secure.companianLogin.url, Controller.companianLogin);
router.post(secure.logout.url, Controller.logout);
router.get(secure.getMyProfile.url, Controller.getMyProfile);
router.get(secure.getMyFeatures.url, Controller.getMyFeatures);
router.post(secure.saveFirebase.url, Controller.saveFirebaseToken);
// users
router.get(secure.getUserFeatures.url, Controller.getUserFeatures);
router.patch(secure.updateMyFeatures.url, Controller.updateMyFeatures);
router.patch(secure.updateUserFeatures.url, Controller.updateUserFeatures);
router.get(secure.getUsers.url, Controller.getUsers);
router.get(secure.getUserById.url, Controller.getUserById);
router.get(secure.getMyCompanians.url, Controller.getMyCompanians);
router.get(secure.getMyPlaylists.url, Controller.getMyPlaylists);
router.get(secure.getMyQuestions.url, Controller.getMyQuestions);
router.get(secure.getMyPermissions.url, Controller.getMyPermissions);
router.get(secure.getMyAccess.url, Controller.getMyAccess);
router.get(secure.getMyConversations.url, Controller.getMyConversations);
router.get(secure.getMyAnswers.url, Controller.getMyAnswers);
router.get(secure.getMyAllLinkedAccounts.url, Controller.getMyAllLinkedAccounts);
router.get(secure.getUserCompanians.url, Controller.getUserCompanians);
router.get(secure.getUserPlaylists.url, Controller.getUserPlaylists);
router.get(secure.getUserQuestions.url, Controller.getUserQuestions);
router.get(secure.getUserPermissions.url, Controller.getUserPermissions);
router.get(secure.getUserAccess.url, Controller.getUserAccess);
router.get(secure.getUserConversations.url, Controller.getUserConversations);
router.get(secure.getUserAnswers.url, Controller.getUserAnswers);
router.get(secure.getUserAllLinkedAccounts.url, Controller.getUserAllLinkedAccounts);
router.post(secure.addUser.url, multipart.single('file'), Controller.addUser);
router.put(secure.editUser.url, multipart.single('file'), Controller.editUser);
router.patch(secure.undeleteUser.url, Controller.undeleteUser);
router.delete(secure.deleteUser.url, Controller.deleteUser);
// companians
// router.get(secure.getCompanians.url, Controller.getCompanians);
// router.get(secure.getCompanianById.url, Controller.getCompanianById);
// router.get(secure.getMyUsers.url, Controller.getMyUsers);
// router.post(secure.addCompanian.url, multipart.single('file'), Controller.addCompanian);
router.get(secure.getMyUsers.url, Controller.getMyUsers);
router.get(secure.getCompanianUsers.url, Controller.getCompanianUsers);
router.post(secure.addMyCompanian.url, multipart.single('file'), Controller.addMyCompanian);
router.post(secure.addUserCompanian.url, multipart.single('file'), Controller.addUserCompanian);
// router.put(secure.editCompanian.url, multipart.single('file'), Controller.editCompanian);
router.post(secure.assignCompanian.url, Controller.assignCompanian);
router.post(secure.grantAccess.url, Controller.grantAccess);
router.post(secure.unlinkCompanian.url, Controller.unlinkCompanian);
router.post(secure.denyAccess.url, Controller.denyAccess);
// router.delete(secure.deleteCompanian.url, Controller.deleteCompanian);
// permissions
router.get(secure.getPermissions.url, Controller.getPermissions);
router.get(secure.getPermissionById.url, Controller.getPermissionById);
router.post(secure.addPermission.url, Controller.addPermission);
router.put(secure.editPermission.url, Controller.editPermission);
router.post(secure.grantPermissions.url, Controller.grantPermissions);
router.delete(secure.deletePermission.url, Controller.deletePermission);
// medias
router.get(secure.getMedias.url, Controller.getMedias);
router.get(secure.getMediaById.url, Controller.getMediaById);
router.post(secure.addMedia.url, multipart.fields([{name: 'media', maxCount: 1},{name: 'albumart', maxCount: 1}]), Controller.addMedia);
router.post(secure.addMediaToPlaylist.url, multipart.fields([{name: 'media', maxCount: 1},{name: 'albumart', maxCount: 1}]), Controller.addMediaToPlaylist);
router.post(secure.assignMedia.url, Controller.assignMedia);
router.delete(secure.deleteMedia.url, Controller.deleteMedia);
// playlists
router.get(secure.getPlaylists.url, Controller.getPlaylists);
router.get(secure.getPlaylistById.url, Controller.getPlaylistById);
router.get(secure.getPlaylistItems.url, Controller.getPlaylistItems);
router.post(secure.addPlaylist.url, Controller.addPlaylist);
router.put(secure.editPlaylist.url, Controller.editPlaylist);
router.post(secure.addMyPlaylist.url, Controller.addMyPlaylist);
router.post(secure.addUserPlaylist.url, Controller.addUserPlaylist);
router.post(secure.assignPlaylist.url, Controller.assignPlaylist);
router.delete(secure.deletePlaylist.url, Controller.deletePlaylist);
// sessions
router.get(secure.getSessions.url, Controller.getSessions);
router.get(secure.getSessionById.url, Controller.getSessionById);
// questions
router.get(secure.getQuestions.url, Controller.getQuestions);
router.get(secure.getMyRandomQuestion.url, Controller.getMyRandomQuestion);
router.get(secure.getQuestionById.url, Controller.getQuestionById);
router.post(secure.addQuestion.url, Controller.addQuestion);
router.post(secure.addMyQuestion.url, Controller.addMyQuestion);
router.post(secure.addUserQuestion.url, Controller.addUserQuestion);
router.put(secure.editQuestion.url, Controller.editQuestion);
router.post(secure.assignQuestion.url, Controller.assignQuestion);
router.delete(secure.deleteQuestion.url, Controller.deleteQuestion);
// answers
router.get(secure.getAnswers.url, Controller.getAnswers);
router.get(secure.getAnswerById.url, Controller.getAnswerById);
router.post(secure.answerRandomQuestion.url, Controller.answerRandomQuestion);
router.post(secure.addAnswer.url, Controller.addAnswer);
router.put(secure.editAnswer.url, Controller.editAnswer);
router.delete(secure.deleteAnswer.url, Controller.deleteAnswer);
// notifications
router.get(secure.getNotifications.url, Controller.getNotifications);
router.get(secure.getNotificationById.url, Controller.getNotificationById);
router.get(secure.getMyNotifications.url, Controller.getMyNotifications);
router.get(secure.getUserNotifications.url, Controller.getUserNotifications);
router.patch(secure.seeNotification.url, Controller.seeNotification);
router.delete(secure.deleteNotification.url, Controller.deleteNotification);
// conversations
router.get(secure.getConversations.url, Controller.getConversations);
router.get(secure.getConversationById.url, Controller.getConversationById);
router.post(secure.addConversation.url, Controller.addConversation);
router.post(secure.addUsersToMyConversation.url, Controller.addUsersToMyConversation);
router.post(secure.addUserConversation.url, Controller.addUserConversation);
router.post(secure.addUsersToUserConversation.url, Controller.addUsersToUserConversation);
router.delete(secure.deleteConversation.url, Controller.deleteConversation);
// messages
router.get(secure.getMessages.url, Controller.getMessages);
router.get(secure.getMessageById.url, Controller.getMessageById);
router.post(secure.sendMessage.url, multipart.single('file'), Controller.sendMessage);
// Agenda
router.post(secure.createAgenda.url, Controller.createAgenda);
router.put(secure.updateAgenda.url, Controller.updateAgenda);
router.delete(secure.deleteAgenda.url, Controller.deleteAgenda);
router.get(secure.getUserAgendaList.url, Controller.getUserAgendaList);
router.get(secure.getAgenda.url, Controller.getAgenda);
export default router;
