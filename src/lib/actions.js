"use server";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExam = exports.deleteExamQuestionUpload = exports.approveExamQuestion = exports.deleteLessonDocumentUpload = exports.approveLessonDocument = exports.updateLessonDocument = exports.uploadLessonDocument = exports.uploadExamQuestion = exports.createExamTimetable = exports.updateExam = exports.createExam = exports.deleteAttendance = exports.updateAttendance = exports.createAttendance = exports.deleteParent = exports.updateParent = exports.createParent = exports.deleteStudent = exports.updateStudent = exports.createStudent = exports.deleteTeacher = exports.updateTeacher = exports.createTeacher = exports.deleteClass = exports.updateClass = exports.createClass = exports.deleteSubject = exports.updateSubject = exports.createSubject = void 0;
var cache_1 = require("next/cache");
var fs_1 = require("fs");
var path_1 = require("path");
var academicContext_1 = require("./academicContext");
var PARENTS_PATH = "/list/parents";
var prisma_1 = require("./prisma");
var server_1 = require("@clerk/nextjs/server");
var getUserRole = function (userId, sessionClaims) { return __awaiter(void 0, void 0, void 0, function () {
    var role, user, err_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                role = (_a = sessionClaims === null || sessionClaims === void 0 ? void 0 : sessionClaims.metadata) === null || _a === void 0 ? void 0 : _a.role;
                if (!(!role && userId)) return [3 /*break*/, 4];
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, server_1.clerkClient.users.getUser(userId)];
            case 2:
                user = _c.sent();
                role = (_b = user.publicMetadata) === null || _b === void 0 ? void 0 : _b.role;
                return [3 /*break*/, 4];
            case 3:
                err_1 = _c.sent();
                console.log("Unable to read user role from Clerk metadata", err_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/, role];
        }
    });
}); };
var createSubject = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.default.subject.create({
                        data: {
                            name: data.name,
                            teachers: {
                                connect: data.teachers.map(function (teacherId) { return ({ id: teacherId }); }),
                            },
                        },
                    })];
            case 1:
                _a.sent();
                // revalidatePath("/list/subjects");
                return [2 /*return*/, { success: true, error: false }];
            case 2:
                err_2 = _a.sent();
                console.log(err_2);
                return [2 /*return*/, { success: false, error: true }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createSubject = createSubject;
var updateSubject = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.default.subject.update({
                        where: {
                            id: data.id,
                        },
                        data: {
                            name: data.name,
                            teachers: {
                                set: data.teachers.map(function (teacherId) { return ({ id: teacherId }); }),
                            },
                        },
                    })];
            case 1:
                _a.sent();
                // revalidatePath("/list/subjects");
                return [2 /*return*/, { success: true, error: false }];
            case 2:
                err_3 = _a.sent();
                console.log(err_3);
                return [2 /*return*/, { success: false, error: true }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateSubject = updateSubject;
var deleteSubject = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = data.get("id");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma_1.default.subject.delete({
                        where: {
                            id: parseInt(id),
                        },
                    })];
            case 2:
                _a.sent();
                // revalidatePath("/list/subjects");
                return [2 /*return*/, { success: true, error: false }];
            case 3:
                err_4 = _a.sent();
                console.log(err_4);
                return [2 /*return*/, { success: false, error: true }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteSubject = deleteSubject;
var createClass = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.default.class.create({
                        data: data,
                    })];
            case 1:
                _a.sent();
                // revalidatePath("/list/class");
                return [2 /*return*/, { success: true, error: false }];
            case 2:
                err_5 = _a.sent();
                console.log(err_5);
                return [2 /*return*/, { success: false, error: true }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createClass = createClass;
var updateClass = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.default.class.update({
                        where: {
                            id: data.id,
                        },
                        data: data,
                    })];
            case 1:
                _a.sent();
                // revalidatePath("/list/class");
                return [2 /*return*/, { success: true, error: false }];
            case 2:
                err_6 = _a.sent();
                console.log(err_6);
                return [2 /*return*/, { success: false, error: true }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateClass = updateClass;
var deleteClass = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, err_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = data.get("id");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma_1.default.class.delete({
                        where: {
                            id: parseInt(id),
                        },
                    })];
            case 2:
                _a.sent();
                // revalidatePath("/list/class");
                return [2 /*return*/, { success: true, error: false }];
            case 3:
                err_7 = _a.sent();
                console.log(err_7);
                return [2 /*return*/, { success: false, error: true }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteClass = deleteClass;
var createTeacher = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var client, user, err_8;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 1:
                client = _b.sent();
                return [4 /*yield*/, client.users.createUser({
                        username: data.username,
                        password: data.password,
                        firstName: data.name,
                        lastName: data.surname,
                        publicMetadata: { role: "teacher" }
                    })];
            case 2:
                user = _b.sent();
                return [4 /*yield*/, prisma_1.default.teacher.create({
                        data: {
                            id: user.id,
                            username: data.username,
                            name: data.name,
                            surname: data.surname,
                            email: data.email || null,
                            phone: data.phone || null,
                            address: data.address,
                            img: data.img || null,
                            bloodType: data.bloodType,
                            sex: data.sex,
                            birthday: data.birthday,
                            subjects: {
                                connect: (_a = data.subjects) === null || _a === void 0 ? void 0 : _a.map(function (subjectId) { return ({
                                    id: parseInt(subjectId),
                                }); }),
                            },
                        },
                    })];
            case 3:
                _b.sent();
                // revalidatePath("/list/teachers");
                return [2 /*return*/, { success: true, error: false }];
            case 4:
                err_8 = _b.sent();
                console.log(err_8);
                return [2 /*return*/, { success: false, error: true }];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.createTeacher = createTeacher;
var updateTeacher = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var client, err_9;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!data.id) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 2:
                client = _b.sent();
                return [4 /*yield*/, client.users.updateUser(data.id, __assign(__assign({ username: data.username }, (data.password !== "" && { password: data.password })), { firstName: data.name, lastName: data.surname }))];
            case 3:
                _b.sent();
                return [4 /*yield*/, prisma_1.default.teacher.update({
                        where: {
                            id: data.id,
                        },
                        data: __assign(__assign({}, (data.password !== "" && { password: data.password })), { username: data.username, name: data.name, surname: data.surname, email: data.email || null, phone: data.phone || null, address: data.address, img: data.img || null, bloodType: data.bloodType, sex: data.sex, birthday: data.birthday, subjects: {
                                set: (_a = data.subjects) === null || _a === void 0 ? void 0 : _a.map(function (subjectId) { return ({
                                    id: parseInt(subjectId),
                                }); }),
                            } }),
                    })];
            case 4:
                _b.sent();
                // revalidatePath("/list/teachers");
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_9 = _b.sent();
                console.log(err_9);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updateTeacher = updateTeacher;
var deleteTeacher = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, client, err_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = data.get("id");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 2:
                client = _a.sent();
                return [4 /*yield*/, client.users.deleteUser(id)];
            case 3:
                _a.sent();
                return [4 /*yield*/, prisma_1.default.teacher.delete({
                        where: {
                            id: id,
                        },
                    })];
            case 4:
                _a.sent();
                // revalidatePath("/list/teachers");
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_10 = _a.sent();
                console.log(err_10);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deleteTeacher = deleteTeacher;
var createStudent = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var classItem, parent_1, client, user, err_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(data);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                return [4 /*yield*/, prisma_1.default.class.findUnique({
                        where: { id: data.classId },
                        include: { _count: { select: { students: true } } },
                    })];
            case 2:
                classItem = _a.sent();
                if (classItem && classItem.capacity === classItem._count.students) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, prisma_1.default.parent.findUnique({
                        where: { id: data.parentId },
                    })];
            case 3:
                parent_1 = _a.sent();
                if (!parent_1) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 4:
                client = _a.sent();
                return [4 /*yield*/, client.users.createUser({
                        username: data.username,
                        password: data.password,
                        firstName: data.name,
                        lastName: data.surname,
                        publicMetadata: { role: "student" }
                    })];
            case 5:
                user = _a.sent();
                return [4 /*yield*/, prisma_1.default.student.create({
                        data: {
                            id: user.id,
                            username: data.username,
                            name: data.name,
                            surname: data.surname,
                            email: data.email || null,
                            phone: data.phone || null,
                            address: data.address,
                            img: data.img || null,
                            bloodType: data.bloodType,
                            sex: data.sex,
                            birthday: data.birthday,
                            gradeId: data.gradeId,
                            classId: data.classId,
                            parentId: data.parentId,
                        },
                    })];
            case 6:
                _a.sent();
                // revalidatePath("/list/students");
                return [2 /*return*/, { success: true, error: false }];
            case 7:
                err_11 = _a.sent();
                console.log(err_11);
                return [2 /*return*/, { success: false, error: true }];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.createStudent = createStudent;
var updateStudent = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var client, err_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!data.id) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 2:
                client = _a.sent();
                return [4 /*yield*/, client.users.updateUser(data.id, __assign(__assign({ username: data.username }, (data.password !== "" && { password: data.password })), { firstName: data.name, lastName: data.surname }))];
            case 3:
                _a.sent();
                return [4 /*yield*/, prisma_1.default.student.update({
                        where: {
                            id: data.id,
                        },
                        data: __assign(__assign({}, (data.password !== "" && { password: data.password })), { username: data.username, name: data.name, surname: data.surname, email: data.email || null, phone: data.phone || null, address: data.address, img: data.img || null, bloodType: data.bloodType, sex: data.sex, birthday: data.birthday, gradeId: data.gradeId, classId: data.classId, parentId: data.parentId }),
                    })];
            case 4:
                _a.sent();
                // revalidatePath("/list/students");
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_12 = _a.sent();
                console.log(err_12);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updateStudent = updateStudent;
var deleteStudent = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, client, err_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = data.get("id");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 2:
                client = _a.sent();
                return [4 /*yield*/, client.users.deleteUser(id)];
            case 3:
                _a.sent();
                return [4 /*yield*/, prisma_1.default.student.delete({
                        where: {
                            id: id,
                        },
                    })];
            case 4:
                _a.sent();
                // revalidatePath("/list/students");
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_13 = _a.sent();
                console.log(err_13);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deleteStudent = deleteStudent;
var createParent = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var client, user, err_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!data.password || data.password.length < 8) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 2:
                client = _a.sent();
                return [4 /*yield*/, client.users.createUser({
                        username: data.username,
                        password: data.password,
                        firstName: data.name,
                        lastName: data.surname,
                        publicMetadata: { role: "parent" },
                    })];
            case 3:
                user = _a.sent();
                return [4 /*yield*/, prisma_1.default.parent.create({
                        data: {
                            id: user.id,
                            username: data.username,
                            name: data.name,
                            surname: data.surname,
                            email: data.email || null,
                            phone: data.phone,
                            address: data.address,
                        },
                    })];
            case 4:
                _a.sent();
                (0, cache_1.revalidatePath)(PARENTS_PATH);
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_14 = _a.sent();
                console.log(err_14);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.createParent = createParent;
var updateParent = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var client, err_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!data.id) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 2:
                client = _a.sent();
                return [4 /*yield*/, client.users.updateUser(data.id, __assign(__assign({ username: data.username }, (data.password !== "" && { password: data.password })), { firstName: data.name, lastName: data.surname }))];
            case 3:
                _a.sent();
                return [4 /*yield*/, prisma_1.default.parent.update({
                        where: { id: data.id },
                        data: {
                            username: data.username,
                            name: data.name,
                            surname: data.surname,
                            email: data.email || null,
                            phone: data.phone,
                            address: data.address,
                        },
                    })];
            case 4:
                _a.sent();
                (0, cache_1.revalidatePath)(PARENTS_PATH);
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_15 = _a.sent();
                console.log(err_15);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updateParent = updateParent;
var deleteParent = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, linked, client, err_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = data.get("id");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                return [4 /*yield*/, prisma_1.default.student.count({ where: { parentId: id } })];
            case 2:
                linked = _a.sent();
                if (linked > 0) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, (0, server_1.clerkClient)()];
            case 3:
                client = _a.sent();
                return [4 /*yield*/, client.users.deleteUser(id)];
            case 4:
                _a.sent();
                return [4 /*yield*/, prisma_1.default.parent.delete({
                        where: { id: id },
                    })];
            case 5:
                _a.sent();
                (0, cache_1.revalidatePath)(PARENTS_PATH);
                return [2 /*return*/, { success: true, error: false }];
            case 6:
                err_16 = _a.sent();
                console.log(err_16);
                return [2 /*return*/, { success: false, error: true }];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.deleteParent = deleteParent;
var createAttendance = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var type, dateValue, present, studentId, teacherId, _a, userId, sessionClaims, role, parsedDate_1, selectedStudentIds, supervised, err_17;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                type = data.type;
                dateValue = data.date || "";
                present = data.present === "true" || data.present === true;
                studentId = data.studentId || null;
                teacherId = data.teacherId || null;
                return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _b.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _b.sent();
                if (!userId || !type || !dateValue) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 3;
            case 3:
                _b.trys.push([3, 12, , 13]);
                parsedDate_1 = new Date(dateValue);
                if (Number.isNaN(parsedDate_1.getTime())) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                if (!(type === "teacher")) return [3 /*break*/, 5];
                if (role !== "admin") {
                    return [2 /*return*/, { success: false, error: true }];
                }
                if (!teacherId) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, prisma_1.default.attendance.create({
                        data: {
                            date: parsedDate_1,
                            present: present,
                            teacher: {
                                connect: { id: teacherId },
                            },
                        },
                    })];
            case 4:
                _b.sent();
                return [3 /*break*/, 11];
            case 5:
                selectedStudentIds = data.studentIds && data.studentIds.length > 0
                    ? data.studentIds
                    : studentId
                        ? [studentId]
                        : [];
                if (selectedStudentIds.length === 0) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                if (!(role === "teacher")) return [3 /*break*/, 7];
                return [4 /*yield*/, prisma_1.default.student.findMany({
                        where: {
                            id: { in: selectedStudentIds },
                            class: {
                                supervisorId: userId,
                            },
                        },
                    })];
            case 6:
                supervised = _b.sent();
                if (supervised.length !== selectedStudentIds.length) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 7;
            case 7:
                if (!(selectedStudentIds.length === 1)) return [3 /*break*/, 9];
                return [4 /*yield*/, prisma_1.default.attendance.create({
                        data: {
                            date: parsedDate_1,
                            present: present,
                            student: {
                                connect: { id: selectedStudentIds[0] },
                            },
                        },
                    })];
            case 8:
                _b.sent();
                return [3 /*break*/, 11];
            case 9: return [4 /*yield*/, prisma_1.default.attendance.createMany({
                    data: selectedStudentIds.map(function (selectedStudentId) { return ({
                        date: parsedDate_1,
                        present: present,
                        studentId: selectedStudentId,
                    }); }),
                })];
            case 10:
                _b.sent();
                _b.label = 11;
            case 11:
                (0, cache_1.revalidatePath)("/list/attendance");
                return [2 /*return*/, { success: true, error: false }];
            case 12:
                err_17 = _b.sent();
                console.log(err_17);
                return [2 /*return*/, { success: false, error: true }];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.createAttendance = createAttendance;
var updateAttendance = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var type, dateValue, present, studentId, teacherId, _a, userId, sessionClaims, role, parsedDate, existing, supervised, err_18;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!data.id) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                type = data.type;
                dateValue = data.date || "";
                present = data.present === "true" || data.present === true;
                studentId = data.studentId || null;
                teacherId = data.teacherId || null;
                return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _b.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _b.sent();
                if (!userId || !type || !dateValue) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 3;
            case 3:
                _b.trys.push([3, 8, , 9]);
                parsedDate = new Date(dateValue);
                if (Number.isNaN(parsedDate.getTime())) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, prisma_1.default.attendance.findUnique({
                        where: { id: data.id },
                        include: { student: { select: { classId: true } } },
                    })];
            case 4:
                existing = _b.sent();
                if (!existing) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                if (role === "teacher" && type === "teacher") {
                    return [2 /*return*/, { success: false, error: true }];
                }
                if (!(role === "teacher" && type === "student")) return [3 /*break*/, 6];
                return [4 /*yield*/, prisma_1.default.student.findFirst({
                        where: {
                            id: studentId,
                            class: {
                                supervisorId: userId,
                            },
                        },
                    })];
            case 5:
                supervised = _b.sent();
                if (!supervised) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 6;
            case 6: return [4 /*yield*/, prisma_1.default.attendance.update({
                    where: { id: data.id },
                    data: {
                        date: parsedDate,
                        present: present,
                        studentId: type === "student" ? studentId : null,
                        teacherId: type === "teacher" ? teacherId : null,
                    },
                })];
            case 7:
                _b.sent();
                (0, cache_1.revalidatePath)("/list/attendance");
                return [2 /*return*/, { success: true, error: false }];
            case 8:
                err_18 = _b.sent();
                console.log(err_18);
                return [2 /*return*/, { success: false, error: true }];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.updateAttendance = updateAttendance;
var deleteAttendance = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, sessionClaims, role, err_19;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                id = data.get("id");
                if (!id) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _c.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                role = (_b = sessionClaims === null || sessionClaims === void 0 ? void 0 : sessionClaims.metadata) === null || _b === void 0 ? void 0 : _b.role;
                if (role !== "admin") {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _c.label = 2;
            case 2:
                _c.trys.push([2, 4, , 5]);
                return [4 /*yield*/, prisma_1.default.attendance.delete({
                        where: { id: Number(id) },
                    })];
            case 3:
                _c.sent();
                (0, cache_1.revalidatePath)("/list/attendance");
                return [2 /*return*/, { success: true, error: false }];
            case 4:
                err_19 = _c.sent();
                console.log(err_19);
                return [2 /*return*/, { success: false, error: true }];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteAttendance = deleteAttendance;
var createExam = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var err_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // if (role === "teacher") {
                //   const teacherLesson = await prisma.lesson.findFirst({
                //     where: {
                //       teacherId: userId!,
                //       id: data.lessonId,
                //     },
                //   });
                //   if (!teacherLesson) {
                //     return { success: false, error: true };
                //   }
                // }
                return [4 /*yield*/, prisma_1.default.exam.create({
                        data: {
                            title: data.title,
                            startTime: data.startTime,
                            endTime: data.endTime,
                            lessonId: data.lessonId,
                        },
                    })];
            case 1:
                // if (role === "teacher") {
                //   const teacherLesson = await prisma.lesson.findFirst({
                //     where: {
                //       teacherId: userId!,
                //       id: data.lessonId,
                //     },
                //   });
                //   if (!teacherLesson) {
                //     return { success: false, error: true };
                //   }
                // }
                _a.sent();
                // revalidatePath("/list/subjects");
                return [2 /*return*/, { success: true, error: false }];
            case 2:
                err_20 = _a.sent();
                console.log(err_20);
                return [2 /*return*/, { success: false, error: true }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createExam = createExam;
var updateExam = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var err_21;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // if (role === "teacher") {
                //   const teacherLesson = await prisma.lesson.findFirst({
                //     where: {
                //       teacherId: userId!,
                //       id: data.lessonId,
                //     },
                //   });
                //   if (!teacherLesson) {
                //     return { success: false, error: true };
                //   }
                // }
                return [4 /*yield*/, prisma_1.default.exam.update({
                        where: {
                            id: data.id,
                        },
                        data: {
                            title: data.title,
                            startTime: data.startTime,
                            endTime: data.endTime,
                            lessonId: data.lessonId,
                        },
                    })];
            case 1:
                // if (role === "teacher") {
                //   const teacherLesson = await prisma.lesson.findFirst({
                //     where: {
                //       teacherId: userId!,
                //       id: data.lessonId,
                //     },
                //   });
                //   if (!teacherLesson) {
                //     return { success: false, error: true };
                //   }
                // }
                _a.sent();
                // revalidatePath("/list/subjects");
                return [2 /*return*/, { success: true, error: false }];
            case 2:
                err_21 = _a.sent();
                console.log(err_21);
                return [2 /*return*/, { success: false, error: true }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateExam = updateExam;
var createExamTimetable = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, sessionClaims, role, startDate, endDate, activePeriod, lesson, err_22;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _b.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _b.sent();
                if (role !== "admin") {
                    return [2 /*return*/, { success: false, error: true }];
                }
                startDate = new Date("".concat(data.date, "T").concat(data.startTime, ":00"));
                endDate = new Date("".concat(data.date, "T").concat(data.endTime, ":00"));
                if (endDate < startDate) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, (0, academicContext_1.getActiveAcademicPeriod)()];
            case 3:
                activePeriod = _b.sent();
                if (!activePeriod.termStart || !activePeriod.termEnd) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                if (startDate < activePeriod.termStart || endDate > activePeriod.termEnd) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                return [4 /*yield*/, prisma_1.default.lesson.findUnique({
                        where: { id: data.lessonId },
                        include: { class: true },
                    })];
            case 4:
                lesson = _b.sent();
                if (!lesson || !data.classIds.includes(lesson.classId)) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, prisma_1.default.exam.create({
                        data: {
                            title: data.title,
                            startTime: startDate,
                            endTime: endDate,
                            lessonId: data.lessonId,
                        },
                    })];
            case 6:
                _b.sent();
                (0, cache_1.revalidatePath)("/list/exams");
                return [2 /*return*/, { success: true, error: false }];
            case 7:
                err_22 = _b.sent();
                console.log(err_22);
                return [2 /*return*/, { success: false, error: true }];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.createExamTimetable = createExamTimetable;
var uploadExamQuestion = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var title, lessonId, file, hasArrayBuffer, _a, userId, sessionClaims, role, activePeriod, lesson, uploadsDir, safeFileName, filePath, buffer, _b, _c, err_23;
    var _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                console.log("[uploadExamQuestion] Input data:", {
                    title: data.title,
                    lessonId: data.lessonId,
                    lessonIdType: typeof data.lessonId,
                    fileType: (_d = data.file) === null || _d === void 0 ? void 0 : _d.constructor.name,
                    fileSize: (_e = data.file) === null || _e === void 0 ? void 0 : _e.size,
                });
                title = (_f = data.title) === null || _f === void 0 ? void 0 : _f.toString().trim();
                lessonId = Number(data.lessonId);
                file = data.file;
                hasArrayBuffer = file && typeof file.arrayBuffer === "function";
                console.log("[uploadExamQuestion] Parsed values:", {
                    title: title,
                    titleValid: Boolean(title),
                    lessonId: lessonId,
                    lessonIdValid: lessonId > 0,
                    fileExists: Boolean(file),
                    hasArrayBuffer: hasArrayBuffer,
                });
                if (!title || lessonId <= 0 || !file) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "Missing required fields: title=".concat(Boolean(title), ", lesson=").concat(lessonId > 0, ", file=").concat(Boolean(file)),
                        }];
                }
                if (!hasArrayBuffer) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "The selected file could not be uploaded. Please choose a valid document.",
                        }];
                }
                return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _g.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _g.sent();
                if (role !== "teacher") {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "Only teachers may upload exam questions.",
                        }];
                }
                return [4 /*yield*/, (0, academicContext_1.getActiveAcademicPeriod)()];
            case 3:
                activePeriod = _g.sent();
                if (!activePeriod.yearLabel || activePeriod.termNumber === null) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "Exam question uploads are only allowed during an active academic term.",
                        }];
                }
                return [4 /*yield*/, prisma_1.default.lesson.findUnique({
                        where: { id: lessonId },
                        include: { class: true },
                    })];
            case 4:
                lesson = _g.sent();
                if (!lesson ||
                    (lesson.teacherId !== userId && lesson.class.supervisorId !== userId)) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "You are not authorized to upload questions for the selected lesson.",
                        }];
                }
                _g.label = 5;
            case 5:
                _g.trys.push([5, 10, , 11]);
                uploadsDir = path_1.default.join(process.cwd(), "public", "uploads", "exam-questions");
                return [4 /*yield*/, fs_1.promises.mkdir(uploadsDir, { recursive: true })];
            case 6:
                _g.sent();
                safeFileName = "".concat(Date.now(), "-").concat(file.name.replace(/[^a-zA-Z0-9_.-]/g, "_"));
                filePath = path_1.default.join(uploadsDir, safeFileName);
                _c = (_b = Buffer).from;
                return [4 /*yield*/, file.arrayBuffer()];
            case 7:
                buffer = _c.apply(_b, [_g.sent()]);
                return [4 /*yield*/, fs_1.promises.writeFile(filePath, buffer)];
            case 8:
                _g.sent();
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.create({
                        data: {
                            title: title,
                            fileName: file.name,
                            fileUrl: "/uploads/exam-questions/".concat(safeFileName),
                            lessonId: lessonId,
                            uploadedById: userId,
                            status: "PENDING",
                            academicYearLabel: activePeriod.yearLabel,
                            termNumber: activePeriod.termNumber,
                        },
                    })];
            case 9:
                _g.sent();
                return [2 /*return*/, { success: true, error: false }];
            case 10:
                err_23 = _g.sent();
                console.log("uploadExamQuestion error:", err_23);
                return [2 /*return*/, {
                        success: false,
                        error: true,
                        message: "An internal error occurred while uploading the file.",
                    }];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.uploadExamQuestion = uploadExamQuestion;
var uploadLessonDocument = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var title, lessonId, weekNumber, file, hasArrayBuffer, _a, userId, sessionClaims, role, activePeriod, lesson, uploadsDir, safeFileName, filePath, buffer, _b, _c, err_24;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                title = (_d = data.title) === null || _d === void 0 ? void 0 : _d.toString().trim();
                lessonId = Number(data.lessonId);
                weekNumber = Number(data.weekNumber);
                file = data.file;
                hasArrayBuffer = file && typeof file.arrayBuffer === "function";
                if (!title || lessonId <= 0 || weekNumber <= 0 || !file) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "Missing required fields: title, lesson, week number, or file.",
                        }];
                }
                if (!hasArrayBuffer) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "The selected file could not be uploaded. Please choose a valid document.",
                        }];
                }
                return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _e.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _e.sent();
                if (role !== "teacher") {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "Only teachers may upload lesson documents.",
                        }];
                }
                return [4 /*yield*/, (0, academicContext_1.getActiveAcademicPeriod)()];
            case 3:
                activePeriod = _e.sent();
                if (!activePeriod.yearLabel || activePeriod.termNumber === null) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "Lesson uploads are only allowed during an active academic term.",
                        }];
                }
                return [4 /*yield*/, prisma_1.default.lesson.findUnique({
                        where: { id: lessonId },
                        include: { class: true },
                    })];
            case 4:
                lesson = _e.sent();
                if (!lesson ||
                    (lesson.teacherId !== userId && lesson.class.supervisorId !== userId)) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "You are not authorized to upload documents for the selected lesson.",
                        }];
                }
                _e.label = 5;
            case 5:
                _e.trys.push([5, 10, , 11]);
                uploadsDir = path_1.default.join(process.cwd(), "public", "uploads", "exam-questions");
                return [4 /*yield*/, fs_1.promises.mkdir(uploadsDir, { recursive: true })];
            case 6:
                _e.sent();
                safeFileName = "".concat(Date.now(), "-").concat(file.name.replace(/[^a-zA-Z0-9_.-]/g, "_"));
                filePath = path_1.default.join(uploadsDir, safeFileName);
                _c = (_b = Buffer).from;
                return [4 /*yield*/, file.arrayBuffer()];
            case 7:
                buffer = _c.apply(_b, [_e.sent()]);
                return [4 /*yield*/, fs_1.promises.writeFile(filePath, buffer)];
            case 8:
                _e.sent();
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.create({
                        data: {
                            title: title,
                            fileName: file.name,
                            fileUrl: "/uploads/exam-questions/".concat(safeFileName),
                            lessonId: lessonId,
                            weekNumber: weekNumber,
                            uploadedById: userId,
                            status: "PENDING",
                            academicYearLabel: activePeriod.yearLabel,
                            termNumber: activePeriod.termNumber,
                        },
                    })];
            case 9:
                _e.sent();
                (0, cache_1.revalidatePath)("/list/lessons");
                return [2 /*return*/, { success: true, error: false }];
            case 10:
                err_24 = _e.sent();
                console.log("uploadLessonDocument error:", err_24);
                return [2 /*return*/, {
                        success: false,
                        error: true,
                        message: "An internal error occurred while uploading the file.",
                    }];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.uploadLessonDocument = uploadLessonDocument;
var updateLessonDocument = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var title, weekNumber, uploadId, file, hasArrayBuffer, _a, userId, sessionClaims, role, existingUpload, fileUpdate, uploadsDir, safeFileName, filePath, buffer, _b, _c, existingPath, err_25, err_26;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                title = (_d = data.title) === null || _d === void 0 ? void 0 : _d.toString().trim();
                weekNumber = Number(data.weekNumber);
                uploadId = Number(data.id);
                file = data.file;
                hasArrayBuffer = !file || typeof file.arrayBuffer === "function";
                if (!title || uploadId <= 0 || weekNumber <= 0) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "Missing required fields: title, week number, or upload id.",
                        }];
                }
                if (!hasArrayBuffer) {
                    return [2 /*return*/, {
                            success: false,
                            error: true,
                            message: "The selected file could not be processed. Please choose a valid document.",
                        }];
                }
                return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _e.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _e.sent();
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.findUnique({
                        where: { id: uploadId },
                    })];
            case 3:
                existingUpload = _e.sent();
                if (!existingUpload) {
                    return [2 /*return*/, { success: false, error: true, message: "Upload not found." }];
                }
                if (role !== "admin" && existingUpload.uploadedById !== userId) {
                    return [2 /*return*/, { success: false, error: true, message: "Unauthorized." }];
                }
                fileUpdate = {};
                if (!file) return [3 /*break*/, 11];
                uploadsDir = path_1.default.join(process.cwd(), "public", "uploads", "exam-questions");
                return [4 /*yield*/, fs_1.promises.mkdir(uploadsDir, { recursive: true })];
            case 4:
                _e.sent();
                safeFileName = "".concat(Date.now(), "-").concat(file.name.replace(/[^a-zA-Z0-9_.-]/g, "_"));
                filePath = path_1.default.join(uploadsDir, safeFileName);
                _c = (_b = Buffer).from;
                return [4 /*yield*/, file.arrayBuffer()];
            case 5:
                buffer = _c.apply(_b, [_e.sent()]);
                return [4 /*yield*/, fs_1.promises.writeFile(filePath, buffer)];
            case 6:
                _e.sent();
                if (!existingUpload.fileUrl) return [3 /*break*/, 10];
                existingPath = path_1.default.join(process.cwd(), "public", existingUpload.fileUrl.replace(/^\//, ""));
                _e.label = 7;
            case 7:
                _e.trys.push([7, 9, , 10]);
                return [4 /*yield*/, fs_1.promises.unlink(existingPath)];
            case 8:
                _e.sent();
                return [3 /*break*/, 10];
            case 9:
                err_25 = _e.sent();
                console.log("updateLessonDocument file removal failed:", err_25);
                return [3 /*break*/, 10];
            case 10:
                fileUpdate = {
                    fileName: file.name,
                    fileUrl: "/uploads/exam-questions/".concat(safeFileName),
                };
                _e.label = 11;
            case 11:
                _e.trys.push([11, 13, , 14]);
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.update({
                        where: { id: uploadId },
                        data: __assign(__assign({ title: title, weekNumber: weekNumber }, fileUpdate), { status: role !== "admin" ? "PENDING" : existingUpload.status, approvedBy: role !== "admin" ? null : existingUpload.approvedBy, approvedAt: role !== "admin" ? null : existingUpload.approvedAt }),
                    })];
            case 12:
                _e.sent();
                (0, cache_1.revalidatePath)("/list/lessons");
                return [2 /*return*/, { success: true, error: false }];
            case 13:
                err_26 = _e.sent();
                console.log("updateLessonDocument error:", err_26);
                return [2 /*return*/, { success: false, error: true, message: "Unable to update the upload." }];
            case 14: return [2 /*return*/];
        }
    });
}); };
exports.updateLessonDocument = updateLessonDocument;
var approveLessonDocument = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, sessionClaims, role, err_27;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _b.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _b.sent();
                if (role !== "admin") {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.update({
                        where: { id: data.id },
                        data: {
                            status: "APPROVED",
                            approvedBy: userId || undefined,
                            approvedAt: new Date(),
                        },
                    })];
            case 4:
                _b.sent();
                (0, cache_1.revalidatePath)("/list/lessons");
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_27 = _b.sent();
                console.log(err_27);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.approveLessonDocument = approveLessonDocument;
var deleteLessonDocumentUpload = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, sessionClaims, role, existingUpload, canDelete, filePath, err_28, err_29;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _b.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _b.sent();
                _b.label = 3;
            case 3:
                _b.trys.push([3, 10, , 11]);
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.findUnique({
                        where: { id: data.id },
                    })];
            case 4:
                existingUpload = _b.sent();
                if (!existingUpload) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                canDelete = role === "admin" || existingUpload.uploadedById === userId;
                if (!canDelete) {
                    return [2 /*return*/, { success: false, error: true }];
                }
                if (!existingUpload.fileUrl) return [3 /*break*/, 8];
                filePath = path_1.default.join(process.cwd(), "public", existingUpload.fileUrl.replace(/^\//, ""));
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, fs_1.promises.unlink(filePath)];
            case 6:
                _b.sent();
                return [3 /*break*/, 8];
            case 7:
                err_28 = _b.sent();
                console.log("deleteLessonDocumentUpload file removal failed:", err_28);
                return [3 /*break*/, 8];
            case 8: return [4 /*yield*/, prisma_1.default.examQuestionUpload.delete({
                    where: { id: data.id },
                })];
            case 9:
                _b.sent();
                (0, cache_1.revalidatePath)("/list/lessons");
                return [2 /*return*/, { success: true, error: false }];
            case 10:
                err_29 = _b.sent();
                console.log(err_29);
                return [2 /*return*/, { success: false, error: true }];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.deleteLessonDocumentUpload = deleteLessonDocumentUpload;
var approveExamQuestion = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, sessionClaims, role, err_30;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _b.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _b.sent();
                if (role !== "admin") {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.update({
                        where: { id: data.id },
                        data: {
                            status: "APPROVED",
                            approvedBy: userId || undefined,
                            approvedAt: new Date(),
                        },
                    })];
            case 4:
                _b.sent();
                return [2 /*return*/, { success: true, error: false }];
            case 5:
                err_30 = _b.sent();
                console.log(err_30);
                return [2 /*return*/, { success: false, error: true }];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.approveExamQuestion = approveExamQuestion;
var deleteExamQuestionUpload = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, sessionClaims, role, existingUpload, filePath, err_31, err_32;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, server_1.auth)()];
            case 1:
                _a = _b.sent(), userId = _a.userId, sessionClaims = _a.sessionClaims;
                return [4 /*yield*/, getUserRole(userId, sessionClaims)];
            case 2:
                role = _b.sent();
                if (role !== "admin") {
                    return [2 /*return*/, { success: false, error: true }];
                }
                _b.label = 3;
            case 3:
                _b.trys.push([3, 10, , 11]);
                return [4 /*yield*/, prisma_1.default.examQuestionUpload.findUnique({
                        where: { id: data.id },
                    })];
            case 4:
                existingUpload = _b.sent();
                if (!(existingUpload === null || existingUpload === void 0 ? void 0 : existingUpload.fileUrl)) return [3 /*break*/, 8];
                filePath = path_1.default.join(process.cwd(), "public", existingUpload.fileUrl.replace(/^\//, ""));
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, fs_1.promises.unlink(filePath)];
            case 6:
                _b.sent();
                return [3 /*break*/, 8];
            case 7:
                err_31 = _b.sent();
                console.log("deleteExamQuestionUpload file removal failed:", err_31);
                return [3 /*break*/, 8];
            case 8: return [4 /*yield*/, prisma_1.default.examQuestionUpload.delete({
                    where: { id: data.id },
                })];
            case 9:
                _b.sent();
                return [2 /*return*/, { success: true, error: false }];
            case 10:
                err_32 = _b.sent();
                console.log(err_32);
                return [2 /*return*/, { success: false, error: true }];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.deleteExamQuestionUpload = deleteExamQuestionUpload;
var deleteExam = function (currentState, data) { return __awaiter(void 0, void 0, void 0, function () {
    var id, err_33;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = data.get("id");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma_1.default.exam.delete({
                        where: {
                            id: parseInt(id),
                            // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
                        },
                    })];
            case 2:
                _a.sent();
                // revalidatePath("/list/subjects");
                return [2 /*return*/, { success: true, error: false }];
            case 3:
                err_33 = _a.sent();
                console.log(err_33);
                return [2 /*return*/, { success: false, error: true }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteExam = deleteExam;
