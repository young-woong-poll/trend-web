현재 테스트용 mock 데이터 핫픽을 생성하고 있습니다.

아래 API 와 지금까지 만든 데이터 중 imageUrl 을 활용해서 더미데이터를 30개 정도 만들어줘

API :
POST https://beta-hotpick-api.votebox.kr/admin/api/v1/hotpicks

지금까지 만든 핫픽 데이터:

```
{
    "code": "T0000",
    "message": "성공",
    "data": {
        "categories": [
            {
                "id": null,
                "name": "전체",
                "slug": "all",
                "selected": true
            },
            {
                "id": 1,
                "name": "연애/결혼",
                "slug": "love-marriage",
                "selected": false
            },
            {
                "id": 2,
                "name": "재테크",
                "slug": "finance",
                "selected": false
            },
            {
                "id": 3,
                "name": "직업",
                "slug": "work",
                "selected": false
            },
            {
                "id": 4,
                "name": "트렌드",
                "slug": "trend",
                "selected": false
            },
            {
                "id": 5,
                "name": "기타",
                "slug": "etc",
                "selected": false
            }
        ],
        "hotpicks": [
            {
                "hotpickId": 17,
                "type": "SINGLE",
                "slug": "health-1",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 5,
                        "name": "기타",
                        "slug": "etc"
                    },
                    {
                        "id": 3,
                        "name": "직업",
                        "slug": "work"
                    }
                ],
                "election": {
                    "electionId": 17,
                    "title": "건강검진 주기",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/c17e3991d1844f4e9368e9255b987b1c.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 43,
                            "displayOrder": 0,
                            "title": "매년",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 44,
                            "displayOrder": 1,
                            "title": "2년마다",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 16,
                "type": "SINGLE",
                "slug": "baby-2",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    },
                    {
                        "id": 2,
                        "name": "재테크",
                        "slug": "finance"
                    }
                ],
                "election": {
                    "electionId": 16,
                    "title": "자녀 학교는?",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/32396cf1bc6e49fcac1cda4083608720.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 41,
                            "displayOrder": 0,
                            "title": "사립학교",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 42,
                            "displayOrder": 1,
                            "title": "공립학교",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 15,
                "type": "SINGLE",
                "slug": "apartment",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    },
                    {
                        "id": 2,
                        "name": "재테크",
                        "slug": "finance"
                    },
                    {
                        "id": 3,
                        "name": "직업",
                        "slug": "work"
                    },
                    {
                        "id": 4,
                        "name": "트렌드",
                        "slug": "trend"
                    },
                    {
                        "id": 5,
                        "name": "기타",
                        "slug": "etc"
                    }
                ],
                "election": {
                    "electionId": 15,
                    "title": "아파트",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/aec6ab1501e545e197d2a3aa6fd14031.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 39,
                            "displayOrder": 0,
                            "title": "갈아타기?",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 40,
                            "displayOrder": 1,
                            "title": "유지",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 14,
                "type": "SINGLE",
                "slug": "family-problem-1",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 4,
                        "name": "트렌드",
                        "slug": "trend"
                    },
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    }
                ],
                "election": {
                    "electionId": 14,
                    "title": "명절 가족이슈",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/fcd6389683b5401fa637efda81db44bc.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 37,
                            "displayOrder": 0,
                            "title": "시댁 명절 감?",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 38,
                            "displayOrder": 1,
                            "title": "안감?",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 13,
                "type": "SINGLE",
                "slug": "workout-place",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 4,
                        "name": "트렌드",
                        "slug": "trend"
                    }
                ],
                "election": {
                    "electionId": 13,
                    "title": "운동은 어디서 하는게 짱?",
                    "imageUrl": null,
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 35,
                            "displayOrder": 0,
                            "title": "헬스장 헬스장 우리동네 헬스장 헬스장 헬스장 우리동네 헬스장 헬스장 헬스장 우리동네 헬스장 헬스장 헬스장 우리동네 헬스장 헬스장 헬스장 우리동네 헬스장",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/2e03decb047740ee9857333e458bc5d6.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 36,
                            "displayOrder": 1,
                            "title": "홈트 홈트 우리집은 홈트 홈트 홈트 우리집은 홈트 홈트 홈트 우리집은 홈트 홈트 홈트 우리집은 홈트 홈트 홈트 우리집은 홈트",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/323c47bfdac641a2abfc40040906a665.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 12,
                "type": "SINGLE",
                "slug": "wedding-hall",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    }
                ],
                "election": {
                    "electionId": 12,
                    "title": "결혼할때 제일 중요한 것은, 아무래도 예식장은 어디로 하는게 좋을까요? 사람마다 너무 생각이 다르고 생애 한 번 뿐인 예식장인데 과연 어디로 하는게 좋을까요",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/78b5ad85bdaf4f0ba6abc48fb94c1359.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 33,
                            "displayOrder": 0,
                            "title": "서울",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 34,
                            "displayOrder": 1,
                            "title": "신부측 지역",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 10,
                "type": "SINGLE",
                "slug": "invest-1",
                "imageUrl": null,
                "expiredAt": "2026-02-27T10:23:00",
                "categories": [
                    {
                        "id": 2,
                        "name": "재테크",
                        "slug": "finance"
                    }
                ],
                "election": {
                    "electionId": 10,
                    "title": "40대, 26년 자산 전략",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/27d2df04b0834795a503cfdeb5db14c8.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 29,
                            "displayOrder": 0,
                            "title": "부동산 추가 매수",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 30,
                            "displayOrder": 1,
                            "title": "금융자산(주식, 채권, 펀드 등)",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 9,
                "type": "SINGLE",
                "slug": "in-job",
                "imageUrl": null,
                "expiredAt": "2026-03-05T10:21:00",
                "categories": [
                    {
                        "id": 3,
                        "name": "직업",
                        "slug": "work"
                    }
                ],
                "election": {
                    "electionId": 9,
                    "title": "직장에서 목표",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/8281843a83ed451eb34d43a6021d236e.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 27,
                            "displayOrder": 0,
                            "title": "임원 트랙 갈 거임?",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 28,
                            "displayOrder": 1,
                            "title": "워라밸 지킬 거임?",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 8,
                "type": "SINGLE",
                "slug": "career-1",
                "imageUrl": null,
                "expiredAt": "2026-04-23T13:19:00",
                "categories": [
                    {
                        "id": 3,
                        "name": "직업",
                        "slug": "work"
                    }
                ],
                "election": {
                    "electionId": 8,
                    "title": "30대 커리어 질문",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/b8a9b3cf9be14a6e94119107c4426f46.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 25,
                            "displayOrder": 0,
                            "title": "안정적 직장 유지",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 26,
                            "displayOrder": 1,
                            "title": "창업 도전",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 7,
                "type": "SINGLE",
                "slug": "first-blind-date",
                "imageUrl": null,
                "expiredAt": "2027-04-21T13:18:00",
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    }
                ],
                "election": {
                    "electionId": 7,
                    "title": "소개팅 첫 만남",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/31f651c421f142459f39ac7799a1299b.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 23,
                            "displayOrder": 0,
                            "title": "밥부터",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 24,
                            "displayOrder": 1,
                            "title": "카페부터",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 6,
                "type": "SINGLE",
                "slug": "night-food",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 5,
                        "name": "기타",
                        "slug": "etc"
                    }
                ],
                "election": {
                    "electionId": 6,
                    "title": "야식 최고는?",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/5d5c0764296c496dbb7d5d1318ce63c2.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 19,
                            "displayOrder": 0,
                            "title": "치킨",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 20,
                            "displayOrder": 1,
                            "title": "피자",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 21,
                            "displayOrder": 2,
                            "title": "족발",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 22,
                            "displayOrder": 3,
                            "title": "떡볶이",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 5,
                "type": "SINGLE",
                "slug": "first-job",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 3,
                        "name": "직업",
                        "slug": "work"
                    }
                ],
                "election": {
                    "electionId": 5,
                    "title": "첫 회사",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/eacf886624d9474fa22a6833048b3d88.jpg",
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 16,
                            "displayOrder": 0,
                            "title": "스타트업",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 17,
                            "displayOrder": 1,
                            "title": "중견기업",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 18,
                            "displayOrder": 2,
                            "title": "대기업",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 4,
                "type": "SINGLE",
                "slug": "marriage-pay",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    }
                ],
                "election": {
                    "electionId": 4,
                    "title": "축의금 기본금",
                    "imageUrl": null,
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 12,
                            "displayOrder": 0,
                            "title": "5만원",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/6aa6f009272c49758ebc12c6377fef50.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 13,
                            "displayOrder": 1,
                            "title": "10만원",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/64ed06e62ccd44b4866569784d49e813.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 14,
                            "displayOrder": 2,
                            "title": "15만원",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/4b57ca6379354fd7b59d702850a61dda.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 15,
                            "displayOrder": 3,
                            "title": "20만원",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/9ea10910c8254321868d65c67f7fa324.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 3,
                "type": "SINGLE",
                "slug": "bline-date",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    }
                ],
                "election": {
                    "electionId": 3,
                    "title": "소개팅 첫 만남",
                    "imageUrl": null,
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 5,
                            "displayOrder": 0,
                            "title": "남자가 밥",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/46556aa2e60249228696310e3c8100ce.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 6,
                            "displayOrder": 1,
                            "title": "더치페이",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/09338721c0994e51817ada69020fdfe8.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 7,
                            "displayOrder": 2,
                            "title": "맘에드는 사람이 밥",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/dc06787221564b9c9f0995efb28eba76.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 2,
                "type": "SINGLE",
                "slug": "ssum",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    }
                ],
                "election": {
                    "electionId": 2,
                    "title": "썸 타는 사람한테",
                    "imageUrl": null,
                    "totalVoteCount": 0,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 3,
                            "displayOrder": 0,
                            "title": "먼저 연락해야 함?",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/81b85e973b3147659fd4b4349b56e909.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        },
                        {
                            "electionItemId": 4,
                            "displayOrder": 1,
                            "title": "기다려야 함?",
                            "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/25/89d79f3dc2264a69878812f6fcc7e124.jpg",
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": false,
                    "myElectionItemId": null
                }
            },
            {
                "hotpickId": 1,
                "type": "SINGLE",
                "slug": "test-hotpick",
                "imageUrl": null,
                "expiredAt": null,
                "categories": [
                    {
                        "id": 1,
                        "name": "연애/결혼",
                        "slug": "love-marriage"
                    }
                ],
                "election": {
                    "electionId": 1,
                    "title": "결혼 전제 아닌 연애",
                    "imageUrl": "https://trend-image.votebox.kr/uploads/2026/02/24/4dd6ea42f413442899985283f3615fc8.png",
                    "totalVoteCount": 1,
                    "totalCommentCount": 0,
                    "items": [
                        {
                            "electionItemId": 1,
                            "displayOrder": 0,
                            "title": "괜찮음",
                            "imageUrl": null,
                            "voteCount": 1,
                            "voteRate": 100,
                            "selected": true
                        },
                        {
                            "electionItemId": 2,
                            "displayOrder": 1,
                            "title": "이해 안됨",
                            "imageUrl": null,
                            "voteCount": 0,
                            "voteRate": 0,
                            "selected": false
                        }
                    ],
                    "voted": true,
                    "myElectionItemId": 1
                }
            }
        ],
        "nextCursor": null,
        "hasMore": false
    }
}
```
